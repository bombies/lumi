package utils

import (
	"sync"
)

type FanOutJobResult[T any] struct {
	JobResult *T
	Err       error
}

type FanOutResult[T any] struct {
	Results []T
	Errors  []FanOutJobResult[T]
}

type FanOutArgs[I, R any] struct {
	Items          []I
	WorkerCount    int
	WorkerCallback func(workerId int, jobs <-chan I, results chan<- FanOutJobResult[R])
}

func FanOut[I, R any](args FanOutArgs[I, R]) FanOutResult[R] {
	items, workerCount, workerFunc := args.Items, args.WorkerCount, args.WorkerCallback

	jobs := make(chan I, len(items))
	results := make(chan FanOutJobResult[R], len(items))

	// A WaitGroup is used to wait for all workers to finish.
	var wg sync.WaitGroup

	// Start workers
	for w := range workerCount {
		wg.Add(1) // Increment the WaitGroup counter
		go func(workerID int) {
			defer wg.Done() // Decrement the counter when the goroutine exits
			workerFunc(workerID, jobs, results)
		}(w)
	}

	// Send jobs
	for _, item := range items {
		jobs <- item
	}
	close(jobs)

	// Start a separate goroutine to close the results channel
	// only after all workers are confirmed to be done.
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results safely
	finalResults := make([]R, 0, len(items))
	errors := make([]FanOutJobResult[R], 0)

	// This for...range loop will automatically and safely exit
	// when the results channel is closed by the goroutine above.
	for result := range results {
		if result.Err != nil {
			errors = append(errors, result)
		} else if result.JobResult != nil {
			finalResults = append(finalResults, *result.JobResult)
		}
	}

	return FanOutResult[R]{
		Results: finalResults,
		Errors:  errors,
	}
}
