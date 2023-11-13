export type GraphDefinition<G, VertexShape> = {
  [Id in keyof G]: VertexShape;
}

export interface VertexOperator<VertexShape, State, Id> {
  getId: (vertex: VertexShape) => Id
  getState: (vertex: VertexShape) => State
  getEdges: (vertex: VertexShape) => Id[]
}

type Key = string

export interface VertexScheduler<Id = Key> {
  isEmpty: () => boolean
  put: (id: Id) => void
  extract: () => Id | undefined
}

export function createTraverseGenerator<VertexShape, State>(
  operator: VertexOperator<VertexShape, State, string>,
  scheduler: VertexScheduler<string>
): <G>(graph: GraphDefinition<G, VertexShape>, startId?: string) => Generator<State> {
  return function* traverseGraphGenerator<G>(
    graph: GraphDefinition<G, VertexShape>,
    startId?: string
  ): Generator<State> {
    const visitedVertices = new Set<string>()

    function shouldSchedule(edgeId: string): boolean {
      return !visitedVertices.has(edgeId) && graph[edgeId as keyof G] != null
    }

    function* traverse(): Generator<State> {
      while (!scheduler.isEmpty()) {
        const currentId = scheduler.extract()
        if (!currentId) {
          break
        }

        if (!visitedVertices.has(currentId)) {
          const vertex: VertexShape = graph[currentId as keyof G]
          visitedVertices.add(currentId)

          yield operator.getState(vertex)

          const edges = operator.getEdges(vertex);
          for (let i = edges.length - 1; i >= 0; i--) {
            const edgeId = edges[i];
            if (shouldSchedule(edgeId)) {
              scheduler.put(edgeId);
            }
          }
        }
      }
    }

    if (startId && graph[startId as keyof G] != null) {
      scheduler.put(startId)
      yield* traverse()
    }

    for (const edgeId of Object.keys(graph)) {
      if (edgeId !== startId && shouldSchedule(edgeId)) {
        scheduler.put(edgeId)
        yield* traverse()
      }
    }
  }
}