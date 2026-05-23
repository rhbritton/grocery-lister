import pendingSyncReducer, {
  enqueuePendingSync,
  dequeuePendingSync,
  clearPendingSync,
} from './pendingSyncSlice';

describe('pendingSyncSlice', () => {
  it('queues a new pending sync item', () => {
    const state = pendingSyncReducer(undefined, enqueuePendingSync({
      type: 'editGroceryList',
      payload: { id: 'list-1' },
      id: 'editGroceryList:list-1',
    }));

    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].type).toBe('editGroceryList');
  });

  it('replaces an existing item with the same id', () => {
    const initial = pendingSyncReducer(undefined, enqueuePendingSync({
      type: 'editGroceryList',
      payload: { id: 'list-1', version: 1 },
      id: 'editGroceryList:list-1',
    }));

    const next = pendingSyncReducer(initial, enqueuePendingSync({
      type: 'editGroceryList',
      payload: { id: 'list-1', version: 2 },
      id: 'editGroceryList:list-1',
    }));

    expect(next.queue).toHaveLength(1);
    expect(next.queue[0].payload).toEqual({ id: 'list-1', version: 2 });
  });

  it('dequeues by id and clears the queue', () => {
    let state = pendingSyncReducer(undefined, enqueuePendingSync({
      type: 'addRecipe',
      payload: { name: 'Toast' },
      id: 'addRecipe:1',
    }));

    state = pendingSyncReducer(state, dequeuePendingSync('addRecipe:1'));
    expect(state.queue).toHaveLength(0);

    state = pendingSyncReducer(undefined, enqueuePendingSync({
      type: 'addRecipe',
      payload: { name: 'Toast' },
      id: 'addRecipe:1',
    }));
    state = pendingSyncReducer(state, clearPendingSync());
    expect(state.queue).toHaveLength(0);
  });
});
