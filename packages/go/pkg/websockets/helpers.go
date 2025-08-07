package websockets

import "github.com/sst/sst/v3/sdk/golang/resource"

func (ws *WebsocketService) OpenConnection(token ...WebsocketToken) error {
	wsEndpoint, err := resource.Get("RealtimeServer", "endpoint")
	if err != nil {
		return err
	}

	wsAuthorizer, err := resource.Get("RealtimeServer", "authorizer")
	if err != nil {
		return err
	}

	var t WebsocketToken
	if len(token) > 0 {
		t = token[0]
	} else {
		t = WebsocketTokenGlobal
	}

	err = ws.CreateConnection(CreateWebsocketConnectionArgs{
		Endpoint:   wsEndpoint.(string),
		Authorizer: wsAuthorizer.(string),
		Token:      t,
	})

	if err != nil {
		return err
	}

	return nil
}
