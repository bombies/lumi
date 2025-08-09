package utils

import (
	"fmt"
	"time"
)

func DateToMMDD(date time.Time) string {
	month := date.Month()
	day := date.Day()
	return fmt.Sprintf("%02d-%02d", month, day)
}

func StartOfMonth(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
}

func EndOfMonth(date time.Time) time.Time {
	nextMonth := date.AddDate(0, 1, 0)
	return time.Date(nextMonth.Year(), nextMonth.Month(), 0, 23, 59, 59, 999999999, date.Location())
}

func FormatIntWithOrdinalSuffix(num int) string {
	if num < 0 {
		return fmt.Sprintf("%d", num)
	}

	suffix := "th"
	switch num % 10 {
	case 1:
		if num % 100 != 11 {
			suffix = "st"
		}
	case 2:
		if num % 100 != 12 {
			suffix = "nd"
		}
	case 3:
		if num % 100 != 13 {
			suffix = "rd"
		}
	}

	return fmt.Sprintf("%d%s", num, suffix)
}
