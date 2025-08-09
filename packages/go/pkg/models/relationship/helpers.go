package relationship

import "github.com/samber/lo"

func ExtractPartnerIdFromRelationship(userId string, relationship RelationshipRecord) string {
	return lo.Ternary(userId == relationship.Partner1, relationship.Partner2, relationship.Partner2)
}
