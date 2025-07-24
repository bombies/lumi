package notification

import (
	"context"
	"log"
	"lumi/pkg/dynamo"
	"lumi/pkg/models"
	"lumi/pkg/models/user"
	"lumi/pkg/utils"
	"lumi/pkg/websockets"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/samber/lo"
	"github.com/sst/sst/v3/sdk/golang/resource"
)

type NotificationService struct {
	DynamoTable *dynamo.DynamoTable
	Logger      *log.Logger
}

func NewNotificationService(dynamoTable *dynamo.DynamoTable) *NotificationService {
	logger := log.New(os.Stdout, "notification-service: ", log.LstdFlags)
	return &NotificationService{
		DynamoTable: dynamoTable,
		Logger:      logger,
	}
}

func (ns *NotificationService) CreateNotificationSubscription(ctx context.Context, userId string, subscription PushSubscription) (*NotificationSubscriberRecord, error) {
	keys := NotificationSubscriberKeys{}
	return dynamo.PutItem(ns.DynamoTable, dynamo.PutItemArgs[NotificationSubscriberRecord]{
		Ctx: ctx,
		Item: NotificationSubscriberRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(userId),
				SK: keys.SK(subscription.Endpoint),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeNotificationSubscriber,
			},
			SubsriberId:    userId,
			Endpoint:       subscription.Endpoint,
			ExpirationTime: subscription.ExpirationTime,
			Keys:           subscription.Keys,
		},
	})
}

func (ns *NotificationService) DeleteNotificationSubscription(ctx context.Context, userId, endpoint string) (bool, error) {
	keys := NotificationSubscriberKeys{}
	return dynamo.DeleteItem(ns.DynamoTable, dynamo.DeleteItemArgs{
		Ctx: ctx,
		PK:  keys.PK(userId),
		SK:  keys.SK(endpoint),
	})
}

func (ns *NotificationService) GetNotificationSubscription(ctx context.Context, userId, endpoint string) (*NotificationSubscriberRecord, error) {
	keys := NotificationSubscriberKeys{}
	return dynamo.GetItem[NotificationSubscriberRecord](ns.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(userId),
		SK:  keys.SK(endpoint),
	})
}

func (ns *NotificationService) GetNotificationSubscriptions(ctx context.Context, userId string) (*dynamo.InfiniteData[NotificationSubscriberRecord], error) {
	keys := NotificationSubscriberKeys{}
	return dynamo.GetItems(ns.DynamoTable, dynamo.GetItemsParams[NotificationSubscriberRecord]{
		Ctx: ctx,
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#pk = :pk",
			Variables: map[string]any{
				":pk": keys.PK(userId),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})
}

type SendNotificationArgs struct {
	User    user.UserRecord
	Payload NotificationPayload
}

type OnlineWebSocketMessageArgs struct {
	MqttConnection websockets.WebsocketService
	Topic          string
}

type SendNotificationOpts struct {
	OnlineWebSocketMessage *OnlineWebSocketMessageArgs
	OnSuccess              func()
}

func (ns *NotificationService) SendNotification(ctx context.Context, args SendNotificationArgs, opts ...SendNotificationOpts) {
	userRecord, payload := args.User, args.Payload

	if userRecord.Status == user.UserStatusOffline || userRecord.Status == user.UserStatusIdle {
		ns.Logger.Printf("%s is offline or idle... Sending notification through webpush\n", userRecord.Username)

		notificationSubs, err := ns.GetNotificationSubscriptions(ctx, userRecord.Id)
		if err != nil {
			ns.Logger.Printf("Error getting notification subscriptions for user %s: %s\n", userRecord.Username, err.Error())
			return
		}

		vapidPubKey, err := resource.Get("VapidPublicKey", "value")
		if err != nil {
			ns.Logger.Printf("Error getting VAPID public key: %s\n", err.Error())
			return
		}

		vapidPrivKey, err := resource.Get("VapidPrivateKey", "value")
		if err != nil {
			ns.Logger.Printf("Error getting VAPID private key: %s\n", err.Error())
			return
		}

		for _, sub := range notificationSubs.Data {
			var subService string

			if strings.Contains(sub.Endpoint, "mozilla") {
				subService = "mozilla"
			} else if strings.Contains(sub.Endpoint, "fcm") {
				subService = "Firebase Cloud Messaging"
			} else if strings.Contains(sub.Endpoint, "apple") {
				subService = "Apple"
			} else {
				subService = "Unknown"
			}

			resp, err := webpush.SendNotification(
				nil,
				&webpush.Subscription{
					Endpoint: sub.Endpoint,
					Keys: webpush.Keys{
						Auth:   sub.Keys.Auth,
						P256dh: sub.Keys.P256dh,
					},
				},
				&webpush.Options{
					Subscriber:      "contact@ajani.me",
					VAPIDPublicKey:  vapidPubKey.(string),
					VAPIDPrivateKey: vapidPrivKey.(string),
				},
			)

			if err != nil {
				ns.Logger.Printf("(%s) Error sending webpush notification to user %s: %s\n", subService, userRecord.Username, err.Error())
				continue
			}

			defer resp.Body.Close()
			ns.Logger.Printf("Successfully sent the notication to the %s subscriber!", subService)
		}
	} else {
		if len(opts) == 0 || opts[0].OnlineWebSocketMessage == nil {
			ns.Logger.Printf("User %s is online... Skipping websocket notification\n", userRecord.Username)
			return
		}

		ns.Logger.Printf("User %s is online... Sending notification through websocket\n", userRecord.Username)
		wsArgs := *opts[0].OnlineWebSocketMessage
		ws, topic := wsArgs.MqttConnection, wsArgs.Topic

		if !ws.IsConnected() {
			ns.Logger.Printf("Websocket is not connected... Skipping websocket notification\n")
			return
		}

		ws.EmitEvent(websockets.EmitEventArgs{
			Topic: topic,
			Event: websockets.WebsocketEventNotification,
			Payload: websockets.NotificationPayload{
				ReceiverID: userRecord.Id,
				From: websockets.NotificationFrom{
					Type: "system",
				},
				Message: websockets.NotificationMessage{
					Title:   payload.Title,
					Content: payload.Body,
				},
				Metadata: payload.Metadata,
			},
			Source: websockets.WebsocketMessageSourceServer,
		})

		ns.Logger.Printf("Sent notification to %s\n", userRecord.Username)
		if opts[0].OnSuccess != nil {
			opts[0].OnSuccess()
		}
	}
}

func (ns *NotificationService) StoreNotification(ctx context.Context, userId string, dto CreateNotificationDto) (*NotificationRecord, error) {
	id, keys := utils.GetUUID(), NotificationKeys{}
	createdAt := time.Now()
	isRead := lo.TernaryF(
		dto.Read != nil,
		func() bool { return *dto.Read },
		func() bool { return false },
	)

	notification, err := dynamo.PutItem(ns.DynamoTable, dynamo.PutItemArgs[NotificationRecord]{
		Ctx: ctx,
		Item: NotificationRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(id),
				SK: keys.SK(id),
			},
			DynamoGSI1Keys: dynamo.DynamoGSI1Keys{
				GSI1PK: keys.GSI1PK(userId),
				GSI1SK: keys.GSI1SK(createdAt),
			},
			DynamoGSI2Keys: dynamo.DynamoGSI2Keys{
				GSI2PK: keys.GSI2PK(userId),
				GSI2SK: keys.GSI2SK(isRead, createdAt),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeNotification,
			},
			Id:      id,
			UserId:  userId,
			Read:    isRead,
			Title:   dto.Title,
			Content: dto.Content,
			OpenUrl: dto.OpenUrl,
		},
	})

	if err != nil {
		return nil, err
	}

	if !isRead {
		_, err = ns.AddUnreadNotificationToCount(ctx, userId)
		if err != nil {
			return nil, err
		}
	}

	return notification, nil
}

func (ns *NotificationService) GetStoredNotifications(ctx context.Context, userId string, dto GetNotificationsDto) (*dynamo.InfiniteData[NotificationRecord], error) {
	keys := NotificationKeys{}
	return dynamo.GetItems(ns.DynamoTable, dynamo.GetItemsParams[NotificationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1sk",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(userId),
			},
		},
		Order:  lo.ToPtr(dynamo.DescendingQueryOrder),
		Cursor: dto.Cursor,
		Limit:  dto.Limit,
	})
}

func (ns *NotificationService) GetFilteredStoredNotifications(ctx context.Context, userId string, dto GetFilteredNotificationsDto) (*dynamo.InfiniteData[NotificationRecord], error) {
	keys := NotificationKeys{}
	return dynamo.GetItems(ns.DynamoTable, dynamo.GetItemsParams[NotificationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI2),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi2pk = :gsi2pk and begins_with(#gsi2sk, :gsi2sk)",
			Variables: map[string]any{
				":gsi2pk": keys.GSI2PK(userId),
				":gsi2sk": keys.BuildKey(string(dto.Filter)),
			},
		},
		Order:  lo.ToPtr(dynamo.DescendingQueryOrder),
		Cursor: dto.Cursor,
		Limit:  dto.Limit,
	})
}

func (ns *NotificationService) UpdateNotification(ctx context.Context, notificationId string, dto UpdateNotificationDto) (*NotificationRecord, error) {
	keys := NotificationKeys{}
	oldNotif, err := dynamo.GetItem[NotificationRecord](ns.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(notificationId),
		SK:  keys.SK(notificationId),
	})

	if err != nil {
		return nil, err
	}

	if oldNotif == nil {
		return nil, &models.ServiceError{
			StatusCode: http.StatusNotFound,
			Message:    "Notification not found",
		}
	}

	var updateBody UpdateableNotificationRecord
	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	if dto.Read != nil {
		updateBody.GSI2SK = dynamo.NewUpdateValue(keys.GSI2SK(*dto.Read, oldNotif.CreatedAt))
	}

	updatedNotif, err := dynamo.UpdateItem[NotificationRecord](ns.DynamoTable, dynamo.UpdateItemArgs{
		Ctx:        ctx,
		PK:         keys.PK(notificationId),
		SK:         keys.SK(notificationId),
		UpdateBody: updateBody,
	})

	if err != nil {
		return nil, err
	}

	if !oldNotif.Read && updatedNotif.Read {
		_, err = ns.RemoveUnreadNotificationFromCount(ctx, oldNotif.UserId)
	} else if oldNotif.Read && !updatedNotif.Read {
		_, err = ns.AddUnreadNotificationToCount(ctx, oldNotif.UserId)
	}

	if err != nil {
		return nil, err
	}

	return updatedNotif, nil
}

func (ns *NotificationService) MarkAllNotificationsAsRead(ctx context.Context, userId string) ([]dynamodb.TransactWriteItemsOutput, []error) {
	keys := NotificationKeys{}
	unreadNotifications, err := dynamo.GetItems(ns.DynamoTable, dynamo.GetItemsParams[NotificationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI2),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi2pk = :gsi2pk and begins_with(#gsi2sk, :gsi2sk)",
			Variables: map[string]any{
				":gsi2pk": keys.GSI2PK(userId),
				":gsi2sk": keys.BuildKey(string(NotificationFilterUnread)),
			},
		},
		Exhaustive: lo.ToPtr(true),
	})

	if err != nil {
		return nil, []error{err}
	}

	if len(unreadNotifications.Data) > 0 {
		args := lo.Map(unreadNotifications.Data, func(notification NotificationRecord, _ int) dynamo.UpdateManyItemArgs {
			return dynamo.UpdateManyItemArgs{
				PK: keys.PK(notification.Id),
				SK: keys.SK(notification.Id),
				UpdateBody: UpdateableNotificationRecord{
					UpdateableGlobalIndex2Keys: dynamo.UpdateableGlobalIndex2Keys{
						GSI2SK: dynamo.NewUpdateValue(keys.GSI2SK(true, notification.CreatedAt)),
					},
					Read: lo.ToPtr(dynamo.NewUpdateValue(true)),
				},
			}
		})

		res, errs := dynamo.UpdateMany[NotificationRecord](ns.DynamoTable, ctx, args)

		if len(errs) != 0 {
			return nil, errs
		}

		_, err = ns.UpdateUnreadNotificationCount(ctx, userId, 0)

		if err != nil {
			return nil, []error{err}
		}

		return res, errs
	}

	return []dynamodb.TransactWriteItemsOutput{}, nil
}

func (ns *NotificationService) MarkBulkNotificiationsAsRead(ctx context.Context, userId string, notificationData []NotificationData) ([]dynamodb.TransactWriteItemsOutput, []error) {
	keys := NotificationKeys{}
	args := lo.Map(notificationData, func(data NotificationData, _ int) dynamo.UpdateManyItemArgs {
		return dynamo.UpdateManyItemArgs{
			PK: keys.PK(data.Id),
			SK: keys.SK(data.Id),
			UpdateBody: UpdateableNotificationRecord{
				UpdateableGlobalIndex2Keys: dynamo.UpdateableGlobalIndex2Keys{
					GSI2SK: dynamo.NewUpdateValue(keys.GSI2SK(true, data.CreatedAt)),
				},
				Read: lo.ToPtr(dynamo.NewUpdateValue(true)),
			},
		}
	})

	res, errs := dynamo.UpdateMany[NotificationRecord](ns.DynamoTable, ctx, args)

	if len(errs) > 0 {
		return nil, errs
	}

	currentCount, err := ns.GetUnreadNotificationCount(ctx, userId)

	if err != nil {
		return nil, []error{err}
	}

	_, err = ns.UpdateUnreadNotificationCount(ctx, userId, currentCount.Count-len(notificationData))

	if err != nil {
		return nil, []error{err}
	}

	return res, nil
}

func (ns *NotificationService) DeleteNotificationsForUser(ctx context.Context, userId string) (bool, error) {
	keys, unreadKeys := NotificationKeys{}, UnreadNotificationCountKeys{}
	notifications, err := dynamo.GetItems(ns.DynamoTable, dynamo.GetItemsParams[NotificationRecord]{
		Ctx:   ctx,
		Index: lo.ToPtr(dynamo.GSI1),
		QueryExpression: dynamo.DynamoQueryExpression{
			Expression: "#gsi1pk = :gsi1pk",
			Variables: map[string]any{
				":gsi1pk": keys.GSI1PK(userId),
			},
		},
	})

	if err != nil {
		return false, err
	}

	args := lo.Map(notifications.Data, func(notification NotificationRecord, _ int) dynamo.BatchWriteItemsArgs {
		return dynamo.BatchWriteItemsArgs{
			Delete: &dynamo.WriteDeleteArgs{
				PK: keys.PK(notification.Id),
				SK: keys.SK(notification.Id),
			},
		}
	})

	dynamo.BatchWriteItems(ns.DynamoTable, ctx, args...)

	unreadNotificationAggregate, err := ns.GetUnreadNotificationCount(ctx, userId)
	if err != nil {
		return false, err
	}

	if unreadNotificationAggregate != nil {
		return dynamo.DeleteItem(ns.DynamoTable, dynamo.DeleteItemArgs{
			Ctx: ctx,
			PK:  unreadKeys.PK(userId),
			SK:  unreadKeys.SK(userId),
		})
	}

	return true, nil
}

func (ns *NotificationService) GetUnreadNotificationCount(ctx context.Context, userId string) (*UnreadNotificationCountRecord, error) {
	keys := UnreadNotificationCountKeys{}
	return dynamo.GetItem[UnreadNotificationCountRecord](ns.DynamoTable, dynamo.GetItemArgs{
		Ctx: ctx,
		PK:  keys.PK(userId),
		SK:  keys.SK(userId),
	})
}

func (ns *NotificationService) AddUnreadNotificationToCount(ctx context.Context, userId string) (*UnreadNotificationCountRecord, error) {
	keys := UnreadNotificationCountKeys{}
	existingCount, err := ns.GetUnreadNotificationCount(ctx, userId)

	if err != nil {
		return nil, err
	}

	if existingCount == nil {
		return dynamo.PutItem(ns.DynamoTable, dynamo.PutItemArgs[UnreadNotificationCountRecord]{
			Ctx: ctx,
			Item: UnreadNotificationCountRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(userId),
					SK: keys.SK(userId),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeUnreadNotificationCount,
				},
				UserId: userId,
				Count:  1,
			},
		})
	}

	var updateBody UpdateableUnreadNotificationCountRecord
	dto := UpdateNotificationCountDto{Count: lo.ToPtr(existingCount.Count + 1)}
	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	return dynamo.UpdateItem[UnreadNotificationCountRecord](ns.DynamoTable, dynamo.UpdateItemArgs{
		Ctx: ctx,
		PK:  keys.PK(userId),
		SK:  keys.PK(userId),
	})
}

func (ns *NotificationService) RemoveUnreadNotificationFromCount(ctx context.Context, userId string) (*UnreadNotificationCountRecord, error) {
	keys := UnreadNotificationCountKeys{}
	existingCount, err := ns.GetUnreadNotificationCount(ctx, userId)

	if err != nil {
		return nil, err
	}

	if existingCount == nil {
		return dynamo.PutItem(ns.DynamoTable, dynamo.PutItemArgs[UnreadNotificationCountRecord]{
			Ctx: ctx,
			Item: UnreadNotificationCountRecord{
				DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
					PK: keys.PK(userId),
					SK: keys.SK(userId),
				},
				DynamoEntityType: dynamo.DynamoEntityType{
					EntityType: EntityTypeUnreadNotificationCount,
				},
				UserId: userId,
				Count:  0,
			},
		})
	}

	var updateBody UpdateableUnreadNotificationCountRecord
	dto := UpdateNotificationCountDto{
		Count: lo.ToPtr(utils.Max(0, existingCount.Count-1)),
	}

	if err := dynamo.TransformToUpdateable(dto, &updateBody); err != nil {
		return nil, err
	}

	return dynamo.UpdateItem[UnreadNotificationCountRecord](ns.DynamoTable, dynamo.UpdateItemArgs{
		Ctx: ctx,
		PK:  keys.PK(userId),
		SK:  keys.PK(userId),
	})
}

func (ns *NotificationService) UpdateUnreadNotificationCount(ctx context.Context, userId string, count int) (*UnreadNotificationCountRecord, error) {
	keys := UnreadNotificationCountKeys{}
	return dynamo.PutItem(ns.DynamoTable, dynamo.PutItemArgs[UnreadNotificationCountRecord]{
		Ctx: ctx,
		Item: UnreadNotificationCountRecord{
			DynamoPrimaryKey: dynamo.DynamoPrimaryKey{
				PK: keys.PK(userId),
				SK: keys.SK(userId),
			},
			DynamoEntityType: dynamo.DynamoEntityType{
				EntityType: EntityTypeUnreadNotificationCount,
			},
			UserId: userId,
			Count:  utils.Max(count, 0),
		},
	})
}
