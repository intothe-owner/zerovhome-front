"use client";

import { useState, useEffect, useRef } from "react";
import { Menu as MenuIcon, ChevronDown, ChevronRight, Plus } from "lucide-react";

interface MenuType {
  id: number;
  name: string;
  parentId: number | null;
  depth: number;
  order: number;
  url: string;
  children?: MenuType[];
}

export default function MenuManagementPage() {
  const [flatMenus, setFlatMenus] = useState<MenuType[]>([]);
  const [tree, setTree] = useState<MenuType[]>([]);
  
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "" });
  const [addingParentId, setAddingParentId] = useState<number | 'root' | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`);
      const json = await res.json();
      if (json.success) {
        setFlatMenus(json.data);
        buildTree(json.data);
        const allIds = json.data.map((m: MenuType) => m.id);
        setExpandedKeys(new Set(allIds));
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchMenus(); }, []);

  const buildTree = (menus: MenuType[]) => {
    const map: Record<number, MenuType> = {};
    const roots: MenuType[] = [];

    menus.forEach((m) => { map[m.id] = { ...m, children: [] }; });
    menus.forEach((m) => {
      if (m.parentId && map[m.parentId]) map[m.parentId].children!.push(map[m.id]);
      else roots.push(map[m.id]);
    });

    const sortTree = (nodes: MenuType[]) => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) sortTree(node.children);
      });
    };
    
    sortTree(roots);
    setTree(roots);
  };

  const handleExpandAll = () => setExpandedKeys(new Set(flatMenus.map(m => m.id)));
  const handleCollapseAll = () => setExpandedKeys(new Set());
  const toggleExpand = (id: number) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (menu: MenuType) => {
    setAddingParentId(null);
    setEditingId(menu.id);
    setEditForm({ name: menu.name, url: menu.url || "" });
  };
  
  const startAdding = (parentId: number | 'root') => {
    setEditingId(null);
    setAddingParentId(parentId);
    setEditForm({ name: "", url: "" });
  };

  const cancelForm = () => {
    setEditingId(null);
    setAddingParentId(null);
  };

  const saveForm = async () => {
    if (!editForm.name.trim()) return alert("메뉴명을 입력해주세요.");

    if (editingId) {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
    } else if (addingParentId !== null) {
      const pId = addingParentId === 'root' ? null : addingParentId;
      const parentMenu = flatMenus.find(m => m.id === pId);
      const depth = parentMenu ? parentMenu.depth + 1 : 1;
      const order = flatMenus.filter(m => m.parentId === pId).length + 1;

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, parentId: pId, depth, order }),
      });
    }
    
    cancelForm();
    fetchMenus();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까? (하위 메뉴가 없어야 합니다)")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) fetchMenus();
    else alert(json.message);
  };

  const onDragStart = (e: React.DragEvent, id: number) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  
  const onDragEnter = (e: React.DragEvent, id: number) => {
    dragOverItem.current = id;
  };

  const onDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      return;
    }

    const dragged = flatMenus.find(m => m.id === dragItem.current);
    const over = flatMenus.find(m => m.id === dragOverItem.current);

    if (dragged && over && dragged.parentId === over.parentId) {
      const siblings = flatMenus
        .filter(m => m.parentId === dragged.parentId)
        .sort((a, b) => a.order - b.order);

      const dragIndex = siblings.findIndex(m => m.id === dragged.id);
      const overIndex = siblings.findIndex(m => m.id === over.id);

      const [removed] = siblings.splice(dragIndex, 1);
      siblings.splice(overIndex, 0, removed);

      const updatedSiblings = siblings.map((m, index) => ({
        ...m, order: index + 1
      }));

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menus: updatedSiblings }),
      });
      fetchMenus();
    } else {
      alert("현재는 동일한 계층(부모) 내에서만 순서 이동이 가능합니다.");
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const renderTree = (nodes: MenuType[]) => {
    return nodes.map((node) => (
      <div key={node.id}>
        {editingId === node.id ? (
          <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-100" style={{ paddingLeft: `${node.depth * 1.5 + 1}rem` }}>
            <MenuIcon size={16} className="text-slate-300 mr-2" />
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="메뉴명" />
            <input type="text" value={editForm.url} onChange={(e) => setEditForm({...editForm, url: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="URL 경로" />
            <div className="flex gap-1 ml-auto">
              <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
              <button onClick={saveForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">확인</button>
            </div>
          </div>
        ) : (
          <div 
            draggable
            onDragStart={(e) => onDragStart(e, node.id)}
            onDragEnter={(e) => onDragEnter(e, node.id)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="group flex items-center justify-between p-3 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors" 
            style={{ paddingLeft: `${node.depth * 1.5}rem` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-300 cursor-grab font-bold text-lg mb-1 leading-none">·</span>
              
              {node.children && node.children.length > 0 ? (
                <button onClick={() => toggleExpand(node.id)} className="text-slate-400">
                  {expandedKeys.has(node.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
              ) : (
                <div className="w-4" />
              )}

              <MenuIcon size={16} className="text-slate-400 cursor-grab" />
              <span className="text-[14px] text-slate-700">{node.name}</span>
              <span className="text-[12px] text-slate-400">({node.children?.length || 0})</span>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-400 border-l border-slate-200 pl-4">{node.url || "링크 없음"}</span>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {node.depth < 3 && (
                  <button onClick={() => startAdding(node.id)} className="px-2 py-1 text-[11px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50">추가</button>
                )}
                <button onClick={() => startEditing(node)} className="px-2 py-1 text-[11px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50">수정</button>
                <button onClick={() => handleDelete(node.id)} className="px-2 py-1 text-[11px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50">삭제</button>
              </div>
            </div>
          </div>
        )}

        {addingParentId === node.id && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-100" style={{ paddingLeft: `${(node.depth + 1) * 1.5 + 1}rem` }}>
            <span className="text-slate-300">└</span>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="새 메뉴명" autoFocus />
            <input type="text" value={editForm.url} onChange={(e) => setEditForm({...editForm, url: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="URL 경로" />
            <div className="flex gap-1 ml-auto">
              <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
              <button onClick={saveForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">확인</button>
            </div>
          </div>
        )}

        {expandedKeys.has(node.id) && node.children && node.children.length > 0 && (
          <div>{renderTree(node.children)}</div>
        )}
      </div>
    ));
  };

  return (
    // max-w-5xl와 mx-auto를 적용하여 화면 정중앙에 깔끔하게 배치
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">메뉴 관리</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-sm text-slate-500 leading-relaxed">
            <p>메뉴 순서를 변경하고 URL 링크를 설정할 수 있습니다. <span className="text-indigo-500 cursor-pointer">자세히 보기</span></p>
            <p>드래그 앤 드롭으로 메뉴 순서를 변경할 수 있습니다. (동일 계층 내)</p>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4">
            <span className="text-sm font-semibold text-slate-400">{flatMenus.length} / 500</span>
            <div className="flex gap-1">
              <button onClick={handleExpandAll} className="px-4 py-1.5 text-xs font-medium border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 rounded shadow-sm">전체 펼치기</button>
              <button onClick={handleCollapseAll} className="px-4 py-1.5 text-xs font-medium border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 rounded shadow-sm">전체 접기</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="flex items-center p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[14px]">
          <MenuIcon size={18} className="text-slate-400 mr-3 ml-4" />
          메뉴 전체보기
        </div>

        {addingParentId === 'root' && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border-b border-slate-100 pl-[2.5rem]">
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="1차 메뉴명" autoFocus />
            <input type="text" value={editForm.url} onChange={(e) => setEditForm({...editForm, url: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="URL 경로" />
            <div className="flex gap-1 ml-auto">
              <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
              <button onClick={saveForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">확인</button>
            </div>
          </div>
        )}

        <div className="pb-4">
          {tree.length > 0 ? renderTree(tree) : (
            <div className="p-8 text-center text-sm text-slate-400">등록된 메뉴가 없습니다.</div>
          )}
        </div>

        <div 
          onClick={() => startAdding('root')}
          className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-[14px]"
        >
          <Plus size={16} /> 메뉴 추가
        </div>
      </div>
    </div>
  );
}