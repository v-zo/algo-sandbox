import {
  createTraverseGenerator,
  type GraphDefinition,
  type VertexOperator,
  type VertexScheduler
} from './traverseGraphGenerator'

type TestGraph = Record<string, { id: string, state: string, edges: string[] }>

describe('traverseGraphGenerator', () => {
  describe('with DFS schediler', () => {
    let operator: VertexOperator<{ id: string, state: string, edges: string[] }, string, string>
    let scheduler: VertexScheduler

    const createDFSScheduler = (): VertexScheduler => {
      const stack: string[] = [];

      return {
        isEmpty: () => stack.length === 0,
        add: (id: string) => stack.unshift(id),
        pull: () => stack.pop()
      }
    }

    beforeEach(() => {
      operator = {
        getId: (vertex) => vertex.id,
        getState: (vertex) => vertex.state,
        getEdges: (vertex) => vertex.edges
      }
      scheduler = createDFSScheduler()
    })

    afterEach(() => {
      operator = null as any
    })

    it('should yield edges in depth-first order', () => {
      type NamedVertexGraph = Record<string, { name: string, state: number, connections: string[] }>

      const namedGraph: GraphDefinition<NamedVertexGraph, { name: string, state: number, connections: string[] }> = {
        One: { name: 'One', state: 1, connections: ['Two'] },
        Two: { name: 'Two', state: 2, connections: ['Three'] },
        Three: { name: 'Three', state: 3, connections: [] }
      }

      const namedOperator: VertexOperator<{ name: string, state: number, connections: string[] }, number, string> = {
        getId: (vertex) => vertex.name,
        getState: (vertex) => vertex.state,
        getEdges: (vertex) => vertex.connections
      }

      const generator = createTraverseGenerator(namedOperator, scheduler)
      const result = generator(namedGraph, 'One')

      const expectedTraversal = [1, 2, 3]
      expect(Array.from(result)).toEqual(expectedTraversal)
    })

    it('should handle graphs where nodes have multiple edges', () => {
      const multiEdgeGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
        A: { id: 'A', state: 'alpha', edges: ['B', 'C'] },
        B: { id: 'B', state: 'beta', edges: ['D'] },
        C: { id: 'C', state: 'gamma', edges: [] },
        D: { id: 'D', state: 'delta', edges: [] }
      }
      const generator = createTraverseGenerator(operator, scheduler)
      const result = generator(multiEdgeGraph, 'A')

      const expectedTraversalMultiEdge = ['alpha', 'beta', 'gamma', 'delta']
      expect(Array.from(result)).toEqual(expectedTraversalMultiEdge)
    })

    it('should handle an empty graph', () => {
      const emptyGraph: GraphDefinition<Record<string, unknown>, Record<string, unknown>> = {}
      const emptyOperator: VertexOperator<Record<string, unknown>, undefined, string> = {
        getId: vertex => '',
        getState: vertex => undefined,
        getEdges: vertex => []
      }
      const generator = createTraverseGenerator(emptyOperator, scheduler)
      const result = Array.from(generator(emptyGraph, ''))

      expect(result).toEqual([])
    })

    it('should handle a graph with a single node and no edges', () => {
      const singleNodeGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
        A: { id: 'A', state: 'alpha', edges: [] }
      }
      const generator = createTraverseGenerator(operator, scheduler)
      const result = generator(singleNodeGraph, 'A')

      expect(Array.from(result)).toEqual(['alpha'])
    })

    it('should handle graphs with cycles', () => {
      const cyclicGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
        A: { id: 'A', state: 'alpha', edges: ['B'] },
        B: { id: 'B', state: 'beta', edges: ['C'] },
        C: { id: 'C', state: 'gamma', edges: ['A'] }
      }
      const generator = createTraverseGenerator(operator, scheduler)
      const result = generator(cyclicGraph, 'A')

      const expectedTraversalWithCycle = ['alpha', 'beta', 'gamma']
      expect(Array.from(result)).toEqual(expectedTraversalWithCycle)
    })

    it('should handle disconnected graphs', () => {
      const disconnectedGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
        A: { id: 'A', state: 'alpha', edges: [] },
        B: { id: 'B', state: 'beta', edges: [] },
        C: { id: 'C', state: 'gamma', edges: [] }
      }
      const generator = createTraverseGenerator(operator, scheduler)
      const result = generator(disconnectedGraph, 'A')

      expect(Array.from(result)).toEqual(['alpha', 'beta', 'gamma'])
    })

    it('should complete traversal even if some nodes do not exist in the graph', () => {
      const incompleteGraph: GraphDefinition<TestGraph, { id: string, state: string, edges: string[] }> = {
        A: { id: 'A', state: 'alpha', edges: ['B'] },
        B: { id: 'B', state: 'beta', edges: ['C'] } // 'C' does not exist in the graph
        // 'C' is missing
      }
      const generator = createTraverseGenerator(operator, scheduler)
      const result = generator(incompleteGraph, 'A')

      const expectedTraversalIncomplete = ['alpha', 'beta']
      expect(Array.from(result)).toEqual(expectedTraversalIncomplete)
    })
  })
})

