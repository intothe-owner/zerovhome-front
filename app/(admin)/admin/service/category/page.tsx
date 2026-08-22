"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu as MenuIcon, ChevronDown, ChevronRight, Plus, X, BadgeDollarSign } from "lucide-react";
import { formatNumber, parseNumber } from "@/lib/function";

interface CategoryType {
  id: number;
  name: string;
  parentId: number | null;
  depth: number;
  order: number;
  isActive: boolean;
  children?: CategoryType[];
}

export default function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", isActive: true });
  const [addingParentId, setAddingParentId] = useState<number | 'root' | null>(null);

  const [selectedCategoryForPrice, setSelectedCategoryForPrice] = useState<CategoryType | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const { data: flatCategories = [] } = useQuery<CategoryType[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category`);
      const json = await res.json();
      if (json.success) {
        const allIds = json.data.map((c: CategoryType) => c.id);
        setExpandedKeys(new Set(allIds));
        return json.data;
      }
      return [];
    },
  });

  const tree = useMemo(() => {
    const map: Record<number, CategoryType> = {};
    const roots: CategoryType[] = [];

    flatCategories.forEach((c) => { map[c.id] = { ...c, children: [] }; });
    flatCategories.forEach((c) => {
      if (c.parentId && map[c.parentId]) map[c.parentId].children!.push(map[c.id]);
      else roots.push(map[c.id]);
    });

    const sortTree = (nodes: CategoryType[]) => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) sortTree(node.children);
      });
    };
    
    sortTree(roots);
    return roots;
  }, [flatCategories]);

  const addMutation = useMutation({
    mutationFn: async (newCategory: any) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (error: Error) => alert(error.message)
  });

  const reorderMutation = useMutation({
    mutationFn: async (categories: CategoryType[]) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
  });

  const handleExpandAll = () => setExpandedKeys(new Set(flatCategories.map(c => c.id)));
  const handleCollapseAll = () => setExpandedKeys(new Set());
  const toggleExpand = (id: number) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (category: CategoryType) => {
    setAddingParentId(null);
    setEditingId(category.id);
    setEditForm({ name: category.name, isActive: category.isActive });
  };
  
  const startAdding = (parentId: number | 'root') => {
    setEditingId(null);
    setAddingParentId(parentId);
    setEditForm({ name: "", isActive: true });
  };

  const cancelForm = () => {
    setEditingId(null);
    setAddingParentId(null);
  };

  const saveForm = () => {
    if (!editForm.name.trim()) return alert("카테고리명을 입력해주세요.");
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editForm }, { onSuccess: cancelForm });
    } else if (addingParentId !== null) {
      const pId = addingParentId === 'root' ? null : addingParentId;
      const parentCategory = flatCategories.find(c => c.id === pId);
      const depth = parentCategory ? parentCategory.depth + 1 : 1;
      const order = flatCategories.filter(c => c.parentId === pId).length + 1;
      addMutation.mutate({ ...editForm, parentId: pId, depth, order }, { onSuccess: cancelForm });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("삭제하시겠습니까? (하위 카테고리가 없어야 합니다)")) return;
    deleteMutation.mutate(id);
  };

  const onDragStart = (e: React.DragEvent, id: number) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnter = (e: React.DragEvent, id: number) => { dragOverItem.current = id; };
  const onDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const dragged = flatCategories.find(c => c.id === dragItem.current);
    const over = flatCategories.find(c => c.id === dragOverItem.current);

    if (dragged && over && dragged.parentId === over.parentId) {
      const siblings = flatCategories.filter(c => c.parentId === dragged.parentId).sort((a, b) => a.order - b.order);
      const dragIndex = siblings.findIndex(c => c.id === dragged.id);
      const overIndex = siblings.findIndex(c => c.id === over.id);
      const [removed] = siblings.splice(dragIndex, 1);
      siblings.splice(overIndex, 0, removed);
      const updatedSiblings = siblings.map((c, index) => ({ ...c, order: index + 1 }));
      reorderMutation.mutate(updatedSiblings);
    } else {
      alert("현재는 동일한 계층(부모) 내에서만 순서 이동이 가능합니다.");
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const renderTree = (nodes: CategoryType[]) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id}>
          {editingId === node.id ? (
            <div className="flex items-center gap-2 p-3 bg-white border-b border-slate-100" style={{ paddingLeft: `${node.depth * 1.5 + 1}rem` }}>
              <MenuIcon size={16} className="text-slate-300 mr-2" />
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="카테고리명" autoFocus />
              <button onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})} className={`px-3 py-1 text-xs font-medium rounded border ${editForm.isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {editForm.isActive ? '✅ 노출' : '❌ 숨김'}
              </button>
              <div className="flex gap-1 ml-auto">
                <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
                <button onClick={saveForm} disabled={updateMutation.isPending} className="px-3 py-1 text-xs border border-slate-300 text-white bg-slate-800 hover:bg-slate-700">
                  {updateMutation.isPending ? '저장중...' : '확인'}
                </button>
              </div>
            </div>
          ) : (
            <div 
              draggable onDragStart={(e) => onDragStart(e, node.id)} onDragEnter={(e) => onDragEnter(e, node.id)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
              className="group flex items-center justify-between p-3 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors" 
              style={{ paddingLeft: `${node.depth * 1.5}rem` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-300 cursor-grab font-bold text-lg mb-1 leading-none">·</span>
                {hasChildren ? (
                  <button onClick={() => toggleExpand(node.id)} className="text-slate-400">
                    {expandedKeys.has(node.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  </button>
                ) : <div className="w-4" />}
                <MenuIcon size={16} className="text-slate-400 cursor-grab" />
                <span className="text-[14px] font-medium text-slate-700">{node.name}</span>
                <span className="text-[12px] text-slate-400">({node.children?.length || 0})</span>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${node.isActive ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {node.isActive ? '노출' : '숨김'}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!hasChildren && (
                    <button 
                      onClick={() => setSelectedCategoryForPrice(node)} 
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 mr-2"
                    >
                      <BadgeDollarSign size={12} /> 요금설정
                    </button>
                  )}

                  {node.depth < 2 && (
                    <button onClick={() => startAdding(node.id)} className="px-2 py-1 text-[11px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50">추가</button>
                  )}
                  <button onClick={() => startEditing(node)} className="px-2 py-1 text-[11px] border border-slate-200 text-slate-600 bg-white hover:bg-slate-50">수정</button>
                  <button onClick={() => handleDelete(node.id)} className="px-2 py-1 text-[11px] border border-slate-200 text-rose-500 bg-white hover:bg-rose-50">삭제</button>
                </div>
              </div>
            </div>
          )}

          {addingParentId === node.id && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-100" style={{ paddingLeft: `${(node.depth + 1) * 1.5 + 1}rem` }}>
              <span className="text-slate-300">└</span>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="2차 카테고리명" autoFocus />
              <button onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})} className={`px-3 py-1 text-xs font-medium rounded border ${editForm.isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                {editForm.isActive ? '✅ 노출' : '❌ 숨김'}
              </button>
              <div className="flex gap-1 ml-auto">
                <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
                <button onClick={saveForm} disabled={addMutation.isPending} className="px-3 py-1 text-xs border border-slate-300 text-white bg-slate-800 hover:bg-slate-700">확인</button>
              </div>
            </div>
          )}

          {expandedKeys.has(node.id) && hasChildren && (
            <div>{renderTree(node.children!)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">서비스 카테고리 관리</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-sm text-slate-500 leading-relaxed">
            <p>1차 및 2차 카테고리를 설정하고, 고객 신청 페이지 노출 여부를 관리합니다.</p>
            <p>하위 항목이 없는 최종 카테고리(2차)에서 <span className="font-bold text-indigo-500">요금설정</span>을 진행할 수 있습니다.</p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4">
            <span className="text-sm font-semibold text-slate-400">총 {flatCategories.length}개</span>
            <div className="flex gap-1">
              <button onClick={handleExpandAll} className="px-4 py-1.5 text-xs font-medium border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 rounded shadow-sm">전체 펼치기</button>
              <button onClick={handleCollapseAll} className="px-4 py-1.5 text-xs font-medium border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 rounded shadow-sm">전체 접기</button>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="flex items-center p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[14px]">
          <MenuIcon size={18} className="text-slate-400 mr-3 ml-4" /> 카테고리 전체보기
        </div>

        {addingParentId === 'root' && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border-b border-slate-100 pl-[2.5rem]">
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="border border-slate-300 p-1 text-sm w-48 rounded" placeholder="1차 카테고리명" autoFocus />
            <button onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})} className={`px-3 py-1 text-xs font-medium rounded border ${editForm.isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              {editForm.isActive ? '✅ 노출' : '❌ 숨김'}
            </button>
            <div className="flex gap-1 ml-auto">
              <button onClick={cancelForm} className="px-3 py-1 text-xs border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
              <button onClick={saveForm} disabled={addMutation.isPending} className="px-3 py-1 text-xs border border-slate-300 text-white bg-slate-800 hover:bg-slate-700">확인</button>
            </div>
          </div>
        )}

        <div className="pb-4">
          {tree.length > 0 ? renderTree(tree) : (
            <div className="p-8 text-center text-sm text-slate-400">등록된 카테고리가 없습니다.</div>
          )}
        </div>

        <div onClick={() => startAdding('root')} className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors font-medium text-[14px]">
          <Plus size={16} /> 1차 카테고리 추가
        </div>
      </div>

      {selectedCategoryForPrice && (
        <PriceSettingModal 
          category={selectedCategoryForPrice} 
          onClose={() => setSelectedCategoryForPrice(null)} 
        />
      )}
    </div>
  );
}

function PriceSettingModal({ category, onClose }: { category: CategoryType, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ unitType: 'PYUNG', unitPrice: 0, basePrice: 0 });
  const [priceId, setPriceId] = useState<number | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["price", category.id],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prices/category/${category.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setForm({ unitType: json.data.unitType, unitPrice: json.data.unitPrice, basePrice: json.data.basePrice });
        setPriceId(json.data.id);
        return json.data;
      }
      return null;
    }
  });

  const savePriceMutation = useMutation({
    mutationFn: async () => {
      // 💡 백엔드로 보낼 때 콤마가 제거된 순수 숫자(number)로 변환하여 전송
      const payload = {
        categoryId: category.id,
        unitType: form.unitType,
        unitPrice: parseNumber(String(form.unitPrice)),
        basePrice: parseNumber(String(form.basePrice)),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price", category.id] });
      alert("요금이 정상적으로 저장되었습니다.");
      onClose();
    }
  });

  const deletePriceMutation = useMutation({
    mutationFn: async () => {
      if (!priceId) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prices/${priceId}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price", category.id] });
      alert("요금 설정이 삭제되었습니다.");
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <BadgeDollarSign className="text-indigo-500" />
            <span className="text-indigo-600">[{category.name}]</span> 요금 설정
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400">데이터를 불러오는 중...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">단위 기준</label>
                <select 
                  value={form.unitType} 
                  onChange={(e) => setForm({...form, unitType: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="PYUNG">평수 단위 (평당 계산)</option>
                  <option value="SQM">면적 단위 (㎡당 계산)</option>
                  <option value="DEVICE">기기 단위 (대당 계산)</option>
                  <option value="FIXED">고정 금액 (단건 계산)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">단위당 가격 (원)</label>
                <div className="relative">
                  {/* 💡 입력할 때는 formatNumber를 적용하여 콤마 표시 */}
                  <input 
                    type="text" 
                    value={formatNumber(form.unitPrice)} 
                    onChange={(e) => setForm({...form, unitPrice: parseNumber(e.target.value)})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm">원</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">기본요금 / 출장비 (원)</label>
                <div className="relative">
                  {/* 💡 입력할 때는 formatNumber를 적용하여 콤마 표시 */}
                  <input 
                    type="text" 
                    value={formatNumber(form.basePrice)} 
                    onChange={(e) => setForm({...form, basePrice: parseNumber(e.target.value)})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 text-sm text-right focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm">원</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">* 기본적으로 청구되는 최소 비용을 입력하세요. (없을 경우 0원)</p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {priceId && (
              <button 
                onClick={() => { if(confirm("이 카테고리의 요금 설정을 삭제하시겠습니까?")) deletePriceMutation.mutate(); }}
                className="text-sm font-semibold text-rose-500 hover:text-rose-700 px-2 py-1"
              >
                설정 삭제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 bg-white hover:bg-slate-50">취소</button>
            <button 
              onClick={() => savePriceMutation.mutate()} 
              disabled={savePriceMutation.isPending || isLoading}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savePriceMutation.isPending ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}