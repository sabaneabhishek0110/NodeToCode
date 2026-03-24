import React, { useCallback, useRef, useState, useEffect, useImperativeHandle } from 'react'
import useGraphStore from '../store/graphStore'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Panel,
  Handle,
  Position,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getBezierPath,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'xyflow'
import 'xyflow/dist/style.css'

/* ════════════════════════════════════════
   CUSTOM BEZIER EDGE (glowing)
   ════════════════════════════════════════ */
function GlowBezierEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style }) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const [hovered, setHovered] = React.useState(false)
  const isInheritance = data?.type === 'inheritance'
  const accentColor = isInheritance ? '#a855f7' : '#3b82f6'
  const glowColor = isInheritance ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'
  return (
    <>
      {/* Invisible wide hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {/* Glow layer */}
      <path d={edgePath} fill="none" stroke={glowColor} strokeWidth={hovered ? 10 : 6} style={{ transition: 'stroke-width 0.15s' }} />
      {/* Main edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={accentColor}
        strokeWidth={hovered ? 3 : 2}
        markerEnd={markerEnd}
        style={{ ...style, transition: 'stroke-width 0.15s' }}
      />
      {isInheritance && (
        <text x={labelX} y={labelY - 14} textAnchor="middle" fill="rgba(168,85,247,0.7)" fontSize={9} fontFamily="monospace">
          extends
        </text>
      )}
      {/* Delete button — visible on hover */}
      <g
        transform={`translate(${labelX}, ${labelY})`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => data?.onDelete?.(id)}
        style={{ cursor: 'pointer', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
      >
        <circle r={9} fill="rgba(10,10,10,0.85)" stroke="rgba(239,68,68,0.6)" strokeWidth={1.5} />
        <text textAnchor="middle" dominantBaseline="middle" fill="rgba(239,68,68,0.9)" fontSize={11} fontWeight="bold">✕</text>
      </g>
    </>
  )
}

/* ════════════════════════════════════════
   PROMPT BOX (shared by all node types)
   ════════════════════════════════════════ */
function PromptBox({ id, data }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-white/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.02] transition group"
      >
        <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold">
          <svg className="w-3 h-3 text-violet-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Prompt
          {data.prompt && !open && (
            <span className="ml-1 bg-violet-500/30 text-violet-300 rounded px-1 text-[9px]">set</span>
          )}
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-2.5">
          <textarea
            value={data.prompt || ''}
            onChange={(e) => data.onUpdate?.(id, { prompt: e.target.value })}
            rows={3}
            placeholder="Describe what this node should do... (sent to AI for code generation)"
            className="nodrag w-full text-[11px] font-mono bg-black/50 text-white/80 px-2 py-1.5 rounded-lg border border-violet-500/20 placeholder-white/20 outline-none focus:border-violet-500/50 resize-none transition"
          />
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════
   CLASS NODE
   ════════════════════════════════════════ */
function ClassNode({ id, data }) {
  const [newVar, setNewVar] = useState('')
  const [editingVar, setEditingVar] = useState(null)
  const [editValue, setEditValue] = useState('')

  const addVariable = () => {
    const v = newVar.trim()
    if (!v) return
    data.onUpdate?.(id, { variables: [...(data.variables || []), v] })
    setNewVar('')
  }

  const removeVariable = (idx) => {
    data.onUpdate?.(id, { variables: (data.variables || []).filter((_, i) => i !== idx) })
  }

  const startEditVar = (idx) => {
    setEditingVar(idx)
    setEditValue(data.variables[idx])
  }

  const saveEditVar = (idx) => {
    const vars = [...(data.variables || [])]
    vars[idx] = editValue
    data.onUpdate?.(id, { variables: vars })
    setEditingVar(null)
  }

  return (
    <div className="node-glow-border">
      <div className="node-inner-card min-w-[260px]">
        {/* Handles */}
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-black" />
        <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-black" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-t-[13px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-mono uppercase">class</span>
            <input
              value={data.name || ''}
              onChange={(e) => data.onUpdate?.(id, { name: e.target.value })}
              className="bg-transparent text-sm font-semibold text-white/90 outline-none w-28 placeholder-white/30"
              placeholder="ClassName"
            />
          </div>
          <div className="flex items-center gap-2">
            {data.parentClass && (
              <span className="text-[9px] text-purple-400 font-mono">extends {data.parentClass}</span>
            )}
            <button
              onClick={() => data.onDelete?.(id)}
              title="Delete node"
              className="text-xs text-red-400/60 hover:text-red-400 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 w-6 h-6 rounded flex items-center justify-center transition font-bold"
            >✕</button>
          </div>
        </div>

        {/* Variables */}
        <div className="px-3 py-2">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1.5 font-semibold">Variables</div>
          {(data.variables || []).length === 0 && (
            <div className="text-[10px] text-white/20 italic mb-1">No variables</div>
          )}
          {(data.variables || []).map((v, i) => (
            <div key={i} className="flex items-center gap-1 mb-1 group">
              <span className="text-[10px] text-emerald-400/60 font-mono mr-1">&#9679;</span>
              {editingVar === i ? (
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEditVar(i)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEditVar(i)}
                  autoFocus
                  className="flex-1 text-xs font-mono bg-white/5 text-white/80 px-1 py-0.5 rounded border border-white/10 outline-none"
                />
              ) : (
                <span
                  className="flex-1 text-xs font-mono text-white/70 cursor-pointer hover:text-white/90"
                  onDoubleClick={() => startEditVar(i)}
                >
                  {v}
                </span>
              )}
              <button onClick={() => removeVariable(i)} className="text-red-400/40 group-hover:text-red-400 hover:!text-red-300 text-xs font-bold bg-red-500/0 hover:bg-red-500/20 w-5 h-5 rounded flex items-center justify-center transition">✕</button>
            </div>
          ))}
          <div className="flex items-center gap-1 mt-1.5">
            <input
              value={newVar}
              onChange={(e) => setNewVar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVariable()}
              placeholder="int count"
              className="flex-1 text-[11px] font-mono bg-white/5 text-white/70 px-1.5 py-1 rounded border border-white/10 placeholder-white/20 outline-none focus:border-blue-500/40"
            />
            <button onClick={addVariable} className="text-sm font-bold px-2 py-1 rounded bg-emerald-600/40 text-emerald-300 hover:bg-emerald-500/60 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-400/60 transition">+</button>
          </div>
        </div>

        {/* Functions count */}
        <div className="px-3 py-1.5 border-t border-white/5 text-[9px] text-white/30">
          {data.functions?.length || 0} function(s) attached
        </div>

        <PromptBox id={id} data={data} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   FUNCTION NODE
   ════════════════════════════════════════ */
function FunctionNode({ id, data }) {
  return (
    <div className="node-glow-border node-glow-border-fn">
      <div className="node-inner-card min-w-[250px]">
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-black" />
        <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-black" />

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-gradient-to-r from-emerald-600/15 to-blue-600/15 rounded-t-[13px]">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono uppercase">fn</span>
          <input
            value={data.name || ''}
            onChange={(e) => data.onUpdate?.(id, { name: e.target.value })}
            className="bg-transparent text-sm font-semibold text-white/90 outline-none flex-1 placeholder-white/30"
            placeholder="methodName"
          />
          <button
            onClick={() => data.onDelete?.(id)}
            title="Delete node"
            className="text-xs text-red-400/60 hover:text-red-400 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 w-6 h-6 rounded flex items-center justify-center transition font-bold ml-auto"
          >✕</button>
        </div>

        {/* Params */}
        <div className="px-3 py-1.5 border-b border-white/5">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1 font-semibold">Params</div>
          <input
            value={data.params || ''}
            onChange={(e) => data.onUpdate?.(id, { params: e.target.value })}
            placeholder="int a, int b"
            className="w-full text-[11px] font-mono bg-white/5 text-white/70 px-1.5 py-1 rounded border border-white/10 placeholder-white/20 outline-none focus:border-blue-500/40"
          />
        </div>

        {/* Return type */}
        <div className="px-3 py-1.5 border-b border-white/5">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1 font-semibold">Return Type</div>
          <input
            value={data.returnType || ''}
            onChange={(e) => data.onUpdate?.(id, { returnType: e.target.value })}
            placeholder="void"
            className="w-full text-[11px] font-mono bg-white/5 text-white/70 px-1.5 py-1 rounded border border-white/10 placeholder-white/20 outline-none focus:border-blue-500/40"
          />
        </div>

        {/* Body */}
        <div className="px-3 py-2">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1 font-semibold">Body</div>
          <textarea
            value={data.code || ''}
            onChange={(e) => data.onUpdate?.(id, { code: e.target.value })}
            rows={4}
            placeholder="// function body"
            className="w-full text-[11px] font-mono bg-black/40 text-white/80 px-2 py-1.5 rounded border border-white/10 placeholder-white/20 outline-none focus:border-blue-500/40 resize-none"
          />
        </div>

        {data.parentClass && (
          <div className="px-3 py-1 border-t border-white/5 text-[9px] text-purple-400/60 font-mono">
            &#8627; {data.parentClass}
          </div>
        )}

        <PromptBox id={id} data={data} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   MAIN / ENTRY POINT NODE
   ════════════════════════════════════════ */
function MainNode({ id, data }) {
  return (
    <div className="node-glow-border node-glow-border-main">
      <div className="node-inner-card min-w-[250px]">
        <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-2.5 !h-2.5 !border-2 !border-black" />
        <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-black" />

        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-gradient-to-r from-amber-600/15 to-red-600/15 rounded-t-[13px]">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono uppercase">main</span>
          <span className="text-sm font-semibold text-white/90 flex-1">Entry Point</span>
          <button
            onClick={() => data.onDelete?.(id)}
            title="Delete node"
            className="text-xs text-red-400/60 hover:text-red-400 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 w-6 h-6 rounded flex items-center justify-center transition font-bold"
          >✕</button>
        </div>

        <div className="px-3 py-2">
          <textarea
            value={data.code || ''}
            onChange={(e) => data.onUpdate?.(id, { code: e.target.value })}
            rows={5}
            placeholder="// main function body"
            className="w-full text-[11px] font-mono bg-black/40 text-white/80 px-2 py-1.5 rounded border border-white/10 placeholder-white/20 outline-none focus:border-blue-500/40 resize-none"
          />
        </div>

        <PromptBox id={id} data={data} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   NODE TYPES & EDGE TYPES
   ════════════════════════════════════════ */
const nodeTypes = {
  classNode: ClassNode,
  functionNode: FunctionNode,
  mainNode: MainNode,
}

const edgeTypes = {
  glowBezier: GlowBezierEdge,
}

/* ════════════════════════════════════════
   ADD NODE MENU
   ════════════════════════════════════════ */
function AddNodeMenu({ onAdd, onClose }) {
  const items = [
    { type: 'classNode', label: 'Class', icon: '◆', desc: 'Variables & methods', color: 'text-blue-400 bg-blue-500/20' },
    { type: 'functionNode', label: 'Function', icon: 'ƒ', desc: 'Method with params & body', color: 'text-emerald-400 bg-emerald-500/20' },
    { type: 'mainNode', label: 'Main / Entry', icon: '▶', desc: 'Program entry point', color: 'text-amber-400 bg-amber-500/20' },
  ]
  return (
    <div className="absolute top-full mt-1 left-0 z-50 bg-black/90 border border-white/10 rounded-xl p-1 shadow-2xl shadow-black/60 backdrop-blur-xl w-56">
      <div className="px-3 py-2 text-[10px] text-white/30 uppercase tracking-wider font-semibold">Add Node</div>
      {items.map((item) => (
        <button
          key={item.type}
          onClick={() => { onAdd(item.type); onClose() }}
          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition group"
        >
          <span className={`text-sm w-7 h-7 rounded-lg flex items-center justify-center font-bold ${item.color}`}>
            {item.icon}
          </span>
          <div>
            <div className="text-xs font-medium text-white/80 group-hover:text-white">{item.label}</div>
            <div className="text-[10px] text-white/30">{item.desc}</div>
          </div>
        </button>
      ))}
      <div className="border-t border-white/5 mt-1 pt-1 px-3 py-2">
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60 transition">Cancel</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   INHERITANCE CONNECTOR MENU
   ════════════════════════════════════════ */
function InheritanceMenu({ classNodes, onSelect, onClose }) {
  if (classNodes.length < 2) return (
    <div className="absolute top-full mt-1 right-0 z-50 bg-black/90 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
      <div className="text-xs text-white/50">Need at least 2 class nodes for inheritance.</div>
      <button onClick={onClose} className="text-[10px] text-white/30 mt-2 hover:text-white/60">Close</button>
    </div>
  )
  return (
    <div className="absolute top-full mt-1 right-0 z-50 bg-black/90 border border-white/10 rounded-xl p-1 shadow-2xl backdrop-blur-xl w-64">
      <div className="px-3 py-2 text-[10px] text-white/30 uppercase tracking-wider font-semibold">Class Inheritance</div>
      <div className="px-3 py-1 text-[10px] text-white/40 mb-1">Select child → parent</div>
      {classNodes.map((child) => (
        <div key={child.id} className="mb-1">
          <div className="px-3 py-1 text-[10px] text-blue-400 font-mono">{child.data.name || 'Unnamed'} extends →</div>
          {classNodes.filter((p) => p.id !== child.id).map((parent) => (
            <button
              key={parent.id}
              onClick={() => { onSelect(child.id, parent.id, parent.data.name); onClose() }}
              className="w-full text-left px-6 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded transition font-mono"
            >
              {parent.data.name || 'Unnamed'}
            </button>
          ))}
        </div>
      ))}
      <div className="border-t border-white/5 mt-1 pt-1 px-3 py-2">
        <button onClick={onClose} className="text-[10px] text-white/30 hover:text-white/60">Cancel</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   MAIN NODE EDITOR COMPONENT
   ════════════════════════════════════════ */
const NodeEditorInner = React.forwardRef(function NodeEditorInner({ projectId, problemId, initial = null, onCodeChange, onPromptGenerated }, ref) {
  const loadGraph = useGraphStore((s) => s.loadGraph)
  const saveGraphToStore = useGraphStore((s) => s.saveGraph)
  const generateCodeAction = useGraphStore((s) => s.generateCode)
  const loadProblemGraph = useGraphStore((s) => s.loadProblemGraph)
  const saveProblemGraph = useGraphStore((s) => s.saveProblemGraph)
  const generateProblemCodeAction = useGraphStore((s) => s.generateProblemCode)
  const getPromptAction = useGraphStore((s) => s.getPrompt)
  const getProblemPromptAction = useGraphStore((s) => s.getProblemPrompt)

  const isProblem = !!problemId
  const entityId = projectId || problemId

  const { setViewport, toObject: rfToObject } = useReactFlow()

  const idRef = useRef(3)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showInheritMenu, setShowInheritMenu] = useState(false)
  const [graphLoading, setGraphLoading] = useState(!!(projectId || problemId))
  const [graphSaving, setGraphSaving] = useState(false)
  const [graphSaveStatus, setGraphSaveStatus] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateStatus, setGenerateStatus] = useState(null) // 'success' | 'error' | 'aiError' | 'empty' | null
  const [generateErrorMsg, setGenerateErrorMsg] = useState('')
  const hasLoaded = useRef(false)
  const userEdited = useRef(false)  // tracks if user made real changes (not just load)

  const defaultNodes = [
    {
      id: '1',
      type: 'classNode',
      position: { x: 50, y: 50 },
      data: { name: 'Main', variables: ['String[] args'], functions: [], onUpdate: null },
    },
    {
      id: '2',
      type: 'functionNode',
      position: { x: 400, y: 80 },
      data: { name: 'solve', params: 'int n', returnType: 'int', code: '// your logic', parentClass: 'Main', onUpdate: null },
    },
  ]
  const defaultEdges = [
    { id: 'e1-2', source: '1', target: '2', type: 'glowBezier', data: {}, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } },
  ]

  const [nodes, setNodes] = useState(() => {
    if (projectId || problemId) return []
    return initial || defaultNodes
  })
  const [edges, setEdges] = useState(() => {
    if (projectId || problemId) return []
    return defaultEdges
  })

  /* ── Delete node ── */
  const deleteNode = useCallback((nodeId) => {
    userEdited.current = true
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
  }, [])

  /* ── Node data update handler ── */
  const handleUpdate = useCallback((nodeId, patch) => {
    userEdited.current = true
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n
        const newData = { ...n.data, ...patch }
        // If this is a class node being renamed, update child function parentClass refs
        if (n.type === 'classNode' && patch.name !== undefined) {
          setNodes((prev) =>
            prev.map((fn) =>
              fn.type === 'functionNode' && fn.data.parentClass === n.data.name
                ? { ...fn, data: { ...fn.data, parentClass: patch.name } }
                : fn
            )
          )
        }
        return { ...n, data: newData }
      })
    )
  }, [])

  /* ── Delete edge ── */
  const deleteEdge = useCallback((edgeId) => {
    userEdited.current = true
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
  }, [])

  /* ── Inject onUpdate and onDelete into all nodes ── */
  useEffect(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, onUpdate: handleUpdate, onDelete: deleteNode } })))
  }, [handleUpdate, deleteNode])

  /* ── Inject onDelete into all edges ── */
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, data: { ...e.data, onDelete: deleteEdge } })))
  }, [deleteEdge])

  /* ── Load graph from backend ── */
  useEffect(() => {
    if (!projectId && !problemId) return
    const load = async () => {
      console.log('[NodeEditor] Loading graph for', isProblem ? 'problemId=' : 'projectId=', entityId)
      setGraphLoading(true)
      const result = isProblem ? await loadProblemGraph(problemId) : await loadGraph(projectId)
      console.log('[NodeEditor] loadGraph result:', result.ok, result.ok ? `${result.data?.nodes?.length} nodes, ${result.data?.edges?.length} edges` : result.error)
      if (result.ok) {
        const { nodes: nodeDTOs, edges: edgeDTOs, viewportX, viewportY, viewportZoom } = result.data
        if (nodeDTOs && nodeDTOs.length > 0) {
          const loadedNodes = nodeDTOs.map(dto => ({
            id: dto.reactFlowId,
            type: dto.type,
            position: { x: dto.positionX, y: dto.positionY },
            data: { ...JSON.parse(dto.metadata || '{}'), onUpdate: handleUpdate, onDelete: deleteNode },
          }))
          const loadedEdges = (edgeDTOs || []).map(dto => {
            const meta = JSON.parse(dto.metadata || '{}')
            return {
              id: dto.reactFlowId,
              source: dto.sourceReactFlowId,
              target: dto.targetReactFlowId,
              type: meta.type || 'glowBezier',
              data: { ...(meta.data || {}), onDelete: deleteEdge },
              markerEnd: meta.markerEnd,
              style: meta.style,
              animated: meta.animated,
            }
          })
          setNodes(loadedNodes)
          setEdges(loadedEdges)
          // Restore viewport if saved
          if (viewportX != null && viewportY != null && viewportZoom != null) {
            setViewport({ x: viewportX, y: viewportY, zoom: viewportZoom })
            console.log('[NodeEditor] Restored viewport:', viewportX, viewportY, viewportZoom)
          }
          const maxId = Math.max(...loadedNodes.map(n => parseInt(n.id) || 0), 0)
          idRef.current = maxId + 1
          console.log('[NodeEditor] Loaded', loadedNodes.length, 'nodes and', loadedEdges.length, 'edges from backend')
        } else {
          // No saved graph yet — start with defaults so user has something to work with
          console.log('[NodeEditor] No saved graph found, using default nodes')
          setNodes(defaultNodes.map(n => ({ ...n, data: { ...n.data, onUpdate: handleUpdate, onDelete: deleteNode } })))
          setEdges(defaultEdges.map(e => ({ ...e, data: { ...(e.data || {}), onDelete: deleteEdge } })))
        }
      } else {
        // Load failed — fall back to defaults
        console.warn('[NodeEditor] Load failed:', result.error, '— using default nodes')
        setNodes(defaultNodes.map(n => ({ ...n, data: { ...n.data, onUpdate: handleUpdate, onDelete: deleteNode } })))
        setEdges(defaultEdges.map(e => ({ ...e, data: { ...(e.data || {}), onDelete: deleteEdge } })))
      }
      setGraphLoading(false)
      hasLoaded.current = true
      userEdited.current = false  // mark that we just loaded, no user edits yet
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, problemId])

  /* ── Helper: get flow state from instance ── */
  const getFlowObject = useCallback(() => {
    try {
      return rfToObject()
    } catch {
      // Fallback if RF not yet ready
      return { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } }
    }
  }, [rfToObject, nodes, edges])

  /* ── Save graph to backend ── */
  const saveGraph = async () => {
    if (!projectId && !problemId) return
    if (nodes.length === 0) {
      setGraphSaveStatus('empty')
      setTimeout(() => setGraphSaveStatus(null), 2000)
      return
    }
    setGraphSaving(true)
    setGraphSaveStatus(null)
    try {
      const flow = getFlowObject()
      console.log('[NodeEditor] Manual save —', isProblem ? 'problemId' : 'projectId', '=', entityId, 'nodes=', flow.nodes?.length, 'edges=', flow.edges?.length)
      const result = isProblem ? await saveProblemGraph(problemId, flow) : await saveGraphToStore(projectId, flow)
      if (result.ok) {
        console.log('[NodeEditor] Save succeeded')
        setGraphSaveStatus('saved')
        setTimeout(() => setGraphSaveStatus(null), 2500)
      } else {
        console.error('[NodeEditor] Save FAILED:', result.error)
        setGraphSaveStatus('error')
        setTimeout(() => setGraphSaveStatus(null), 5000)
      }
    } catch (err) {
      console.error('[NodeEditor] Save threw exception:', err)
      setGraphSaveStatus('error')
      setTimeout(() => setGraphSaveStatus(null), 5000)
    } finally {
      setGraphSaving(false)
    }
  }

  /* ── Generate Code from node structure ── */
  const handleGenerateCode = async () => {
    if (!projectId && !problemId) return
    if (nodes.length === 0) {
      setGenerateStatus('empty')
      setTimeout(() => setGenerateStatus(null), 2000)
      return
    }
    setGenerating(true)
    setGenerateStatus(null)
    try {
      const flow = getFlowObject()
      console.log('[NodeEditor] Generate code —', isProblem ? 'problemId' : 'projectId', '=', entityId, 'nodes=', flow.nodes?.length)
      const result = isProblem ? await generateProblemCodeAction(problemId, flow) : await generateCodeAction(projectId, flow)
      if (result.ok) {
        console.log('[NodeEditor] Code generated successfully, prompt length=', result.data?.prompt?.length)

        if (result.data?.aiUnavailable) {
          // AI call failed — show error, do NOT put anything in the editor
          const errMsg = result.data?.aiError || 'AI generation failed. Check your API key.'
          console.warn('[NodeEditor] AI unavailable:', errMsg)
          setGenerateErrorMsg(errMsg)
          setGenerateStatus('aiError')
          setTimeout(() => setGenerateStatus(null), 8000)
        } else {
          setGenerateStatus('success')
          if (onCodeChange && result.data?.generatedCode) {
            onCodeChange(result.data.generatedCode)
          }
          if (onPromptGenerated && result.data?.prompt) {
            onPromptGenerated(result.data.prompt)
          }
          setTimeout(() => setGenerateStatus(null), 3000)
        }
      } else {
        console.error('[NodeEditor] Generate code FAILED:', result.error)
        setGenerateStatus('error')
        setTimeout(() => setGenerateStatus(null), 5000)
      }
    } catch (err) {
      console.error('[NodeEditor] Generate code threw exception:', err)
      setGenerateStatus('error')
      setTimeout(() => setGenerateStatus(null), 5000)
    } finally {
      setGenerating(false)
    }
  }

  /* ── Expose triggerGenerate and triggerGetPrompt to parent via ref ── */
  useImperativeHandle(ref, () => ({
    triggerGenerate: handleGenerateCode,
    triggerGetPrompt: async () => {
      if (!projectId && !problemId) return null
      if (nodes.length === 0) return null
      try {
        const flow = getFlowObject()
        const result = isProblem
          ? await getProblemPromptAction(problemId, flow)
          : await getPromptAction(projectId, flow)
        if (result.ok) return result.data?.prompt || ''
        return null
      } catch {
        return null
      }
    },
  }), [handleGenerateCode, projectId, problemId, nodes, isProblem, getFlowObject, getPromptAction, getProblemPromptAction])

  /* ── Auto-save graph (debounced 3s after any USER change) ── */
  useEffect(() => {
    if (!entityId || !hasLoaded.current || !userEdited.current || nodes.length === 0) return
    const timer = setTimeout(() => {
      try {
        const flow = rfToObject()
        console.log('[NodeEditor] Auto-save triggered — nodes=', flow.nodes?.length, 'edges=', flow.edges?.length)
        if (isProblem) saveProblemGraph(problemId, flow)
        else saveGraphToStore(projectId, flow)
      } catch {
        const flow = { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } }
        if (isProblem) saveProblemGraph(problemId, flow)
        else saveGraphToStore(projectId, flow)
      }
    }, 3000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, nodes, edges])

  /* ── xyflow callbacks ── */
  const onNodesChange = useCallback((changes) => {
    userEdited.current = true
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const onEdgesChange = useCallback((changes) => {
    userEdited.current = true
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

  const onConnect = useCallback((params) => {
    userEdited.current = true
    setEdges((eds) => addEdge({
      ...params,
      type: 'glowBezier',
      data: { onDelete: deleteEdge },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    }, eds))

    // If connecting class → function, set parentClass
    setNodes((nds) => {
      const source = nds.find((n) => n.id === params.source)
      const target = nds.find((n) => n.id === params.target)
      if (source?.type === 'classNode' && target?.type === 'functionNode') {
        return nds.map((n) =>
          n.id === target.id ? { ...n, data: { ...n.data, parentClass: source.data.name || 'Unnamed' } } : n
        )
      }
      return nds
    })
  }, [deleteEdge])

  /* ── Add node ── */
  const addNode = useCallback((type) => {
    userEdited.current = true
    const newId = String(idRef.current++)
    const defaults = {
      classNode: { name: 'NewClass', variables: [], functions: [], onUpdate: handleUpdate, onDelete: deleteNode },
      functionNode: { name: 'newMethod', params: '', returnType: 'void', code: '', parentClass: '', onUpdate: handleUpdate, onDelete: deleteNode },
      mainNode: { code: '', onUpdate: handleUpdate, onDelete: deleteNode },
    }
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type,
        position: { x: 150 + Math.random() * 200, y: 100 + Math.random() * 150 },
        data: defaults[type] || defaults.functionNode,
      },
    ])
  }, [handleUpdate, deleteNode])

  /* ── Set inheritance ── */
  const setInheritance = useCallback((childId, parentId, parentName) => {
    userEdited.current = true
    // Update child class data
    setNodes((nds) => nds.map((n) =>
      n.id === childId ? { ...n, data: { ...n.data, parentClass: parentName } } : n
    ))
    // Add inheritance edge
    setEdges((eds) => {
      const existing = eds.find((e) => e.source === childId && e.data?.type === 'inheritance')
      const filtered = existing ? eds.filter((e) => e.id !== existing.id) : eds
      return addEdge({
        id: `inherit-${childId}-${parentId}`,
        source: childId,
        target: parentId,
        type: 'glowBezier',
        data: { type: 'inheritance', onDelete: deleteEdge },
        animated: true,
        markerEnd: { type: MarkerType.Arrow, color: '#a855f7' },
        style: { strokeDasharray: '6 3' },
      }, filtered)
    })
  }, [deleteEdge])

  const classNodes = nodes.filter((n) => n.type === 'classNode')

  return (
    <div className="h-full rounded-lg border border-white/10 bg-black/80 relative">
      {/* Toolbar */}
      <div className="p-2 bg-black/60 text-white flex items-center flex-wrap gap-2 border-b border-white/10 relative z-20">
        <div className="relative">
          <button
            onClick={() => { setShowAddMenu(!showAddMenu); setShowInheritMenu(false) }}
            className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/60 text-white/90 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span className="text-emerald-400 text-base font-bold">+</span> Add Node
          </button>
          {showAddMenu && <AddNodeMenu onAdd={addNode} onClose={() => setShowAddMenu(false)} />}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowInheritMenu(!showInheritMenu); setShowAddMenu(false) }}
            className="text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/60 text-white/90 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            <span className="text-purple-400 text-base font-bold">⬦</span> Inheritance
          </button>
          {showInheritMenu && (
            <InheritanceMenu
              classNodes={classNodes}
              onSelect={setInheritance}
              onClose={() => setShowInheritMenu(false)}
            />
          )}
        </div>

        {(projectId || problemId) && (
          <button
            onClick={saveGraph}
            disabled={graphSaving}
            className="text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-400/60 text-white/90 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
          >
            {graphSaving ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Saving
              </span>
            ) : graphSaveStatus === 'saved' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Saved
              </span>
            ) : graphSaveStatus === 'error' ? (
              <span className="text-red-400">Failed</span>
            ) : graphSaveStatus === 'empty' ? (
              <span className="text-amber-400">Nothing to save</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M8 7V3h8v4M8 7h8" />
                </svg>
                Save Graph
              </span>
            )}
          </button>
        )}

        {(projectId || problemId) && (
          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 text-white/90 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 disabled:opacity-40 flex-shrink-0"
          >
            {generating ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Generating...
              </span>
            ) : generateStatus === 'success' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Generated
              </span>
            ) : generateStatus === 'error' ? (
              <span className="text-red-400">Generation Failed</span>
            ) : generateStatus === 'aiError' ? (
              <span className="text-red-400">AI Error</span>
            ) : generateStatus === 'empty' ? (
              <span className="text-amber-400">Add nodes first</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Code
              </span>
            )}
          </button>
        )}

        <div className="flex-1" />
      </div>

      {/* React Flow Canvas */}
      <div style={{ height: 'calc(100% - 44px)' }} className="relative overflow-hidden rounded-b-lg">

        {/* AI error toast */}
        {generateStatus === 'aiError' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-start gap-2.5 max-w-sm w-full mx-3 bg-red-950/90 border border-red-500/40 text-red-300 text-xs px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm pointer-events-none">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="leading-snug">{generateErrorMsg || 'AI generation failed. Check your API key in Profile → AI Settings.'}</span>
          </div>
        )}

        {graphLoading && (
          <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm">Loading graph...</span>
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'glowBezier' }}
          fitView
          /* Allow deep zoom-out and effectively unlimited panning */
          minZoom={0.01}
          maxZoom={4}
          translateExtent={[[Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY], [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]]}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          panOnScroll={true}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#000000' }}
        >
          <Controls className="!bg-black/90 !border-white/20 !rounded-sm [&>button]:!bg-white/20 [&>button]:!border-white/20 [&>button]:!text-white/80 [&>button]:!w-4 [&>button]:!h-4 [&>button:hover]:!bg-white/25 [&>button:hover]:!text-white [&>button:hover]:!border-white/40" />
          <MiniMap
            className="!bg-black/80 !border-white/10 !rounded-lg"
            nodeColor={(n) => {
              if (n.type === 'classNode') return '#3b82f6'
              if (n.type === 'functionNode') return '#10b981'
              return '#f59e0b'
            }}
            maskColor="rgba(0,0,0,0.7)"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.03)" />
        </ReactFlow>
      </div>
    </div>
  )
})

// Wrap with ReactFlowProvider so useReactFlow() works
const NodeEditor = React.forwardRef(function NodeEditor(props, ref) {
  return (
    <ReactFlowProvider>
      <NodeEditorInner {...props} ref={ref} />
    </ReactFlowProvider>
  )
})
export default NodeEditor
