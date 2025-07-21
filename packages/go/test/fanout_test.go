package test

import (
	"errors"
	"lumi/pkg/utils"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestFanOut_Success(t *testing.T) {
	items := []int{1, 2, 3, 4, 5}

	result := utils.FanOut(utils.FanOutArgs[int, string]{
		Items:       items,
		WorkerCount: 2,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[string]) {
			for job := range jobs {
				str := strconv.Itoa(job * 2)
				results <- utils.FanOutJobResult[string]{JobResult: &str}
			}
		},
	})

	assert.Len(t, result.Results, 5)
	assert.Len(t, result.Errors, 0)
	assert.Contains(t, result.Results, "2")
	assert.Contains(t, result.Results, "4")
	assert.Contains(t, result.Results, "6")
	assert.Contains(t, result.Results, "8")
	assert.Contains(t, result.Results, "10")
}

func TestFanOut_WithErrors(t *testing.T) {
	items := []int{1, 2, 3, 4, 5}

	result := utils.FanOut(utils.FanOutArgs[int, string]{
		Items:       items,
		WorkerCount: 2,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[string]) {
			for job := range jobs {
				if job%2 == 0 {
					results <- utils.FanOutJobResult[string]{Err: errors.New("even number error")}
				} else {
					str := strconv.Itoa(job)
					results <- utils.FanOutJobResult[string]{JobResult: &str}
				}
			}
		},
	})

	assert.Len(t, result.Results, 3) // 1, 3, 5
	assert.Len(t, result.Errors, 2)  // 2, 4
	assert.Contains(t, result.Results, "1")
	assert.Contains(t, result.Results, "3")
	assert.Contains(t, result.Results, "5")
}

func TestFanOut_EmptyItems(t *testing.T) {
	items := []int{}

	result := utils.FanOut(utils.FanOutArgs[int, string]{
		Items:       items,
		WorkerCount: 2,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[string]) {
			for job := range jobs {
				str := strconv.Itoa(job)
				results <- utils.FanOutJobResult[string]{JobResult: &str}
			}
		},
	})

	assert.Len(t, result.Results, 0)
	assert.Len(t, result.Errors, 0)
}

func TestFanOut_SingleWorker(t *testing.T) {
	items := []int{1, 2, 3}

	result := utils.FanOut(utils.FanOutArgs[int, string]{
		Items:       items,
		WorkerCount: 1,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[string]) {
			for job := range jobs {
				str := strconv.Itoa(job)
				results <- utils.FanOutJobResult[string]{JobResult: &str}
			}
		},
	})

	assert.Len(t, result.Results, 3)
	assert.Len(t, result.Errors, 0)
	assert.Contains(t, result.Results, "1")
	assert.Contains(t, result.Results, "2")
	assert.Contains(t, result.Results, "3")
}

func TestFanOut_NilResults(t *testing.T) {
	items := []int{1, 2, 3}

	result := utils.FanOut(utils.FanOutArgs[int, string]{
		Items:       items,
		WorkerCount: 2,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[string]) {
			for range jobs {
				results <- utils.FanOutJobResult[string]{JobResult: nil}
			}
		},
	})

	assert.Len(t, result.Results, 0)
	assert.Len(t, result.Errors, 0)
}

func TestFanOut_ConcurrentProcessing(t *testing.T) {
	items := make([]int, 100)
	for i := range items {
		items[i] = i
	}

	start := time.Now()
	result := utils.FanOut(utils.FanOutArgs[int, int]{
		Items:       items,
		WorkerCount: 10,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[int]) {
			for job := range jobs {
				time.Sleep(1 * time.Millisecond) // Simulate work
				doubled := job * 2
				results <- utils.FanOutJobResult[int]{JobResult: &doubled}
			}
		},
	})
	duration := time.Since(start)

	assert.Len(t, result.Results, 100)
	assert.Len(t, result.Errors, 0)
	assert.Less(t, duration, 50*time.Millisecond) // Should be much faster than sequential
}

func TestFanOut_WorkerIdPassed(t *testing.T) {
	items := []int{1, 2, 3, 4}
	workerIds := make(map[int]bool)

	result := utils.FanOut(utils.FanOutArgs[int, int]{
		Items:       items,
		WorkerCount: 2,
		WorkerCallback: func(workerId int, jobs <-chan int, results chan<- utils.FanOutJobResult[int]) {
			workerIds[workerId] = true
			for job := range jobs {
				results <- utils.FanOutJobResult[int]{JobResult: &job}
			}
		},
	})

	assert.Len(t, result.Results, 4)
	assert.Len(t, workerIds, 2)
	assert.True(t, workerIds[0])
	assert.True(t, workerIds[1])
}
