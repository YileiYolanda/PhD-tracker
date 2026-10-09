import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cloudConfigured } from '../lib/supabase'
import { parseData } from '../lib/trackerData'
import type { TrashEntry } from '../lib/trackerData'
import { moveToTrash, restoreTrash } from '../lib/trash'
import type { School, Material, Professor, Document, Recommender, Interview } from '../types'
import { seedSchools, seedMaterials, seedProfessors, seedDocuments, seedRecommenders, seedInterviews } from '../data/seed'
import { generateId } from '../lib/utils'

interface AppState {
  schools: School[]
  materials: Material[]
  professors: Professor[]
  documents: Document[]
  recommenders: Recommender[]
  interviews: Interview[]
  trash: TrashEntry[]
  restoreFromTrash: (id: string) => void
  permanentlyDelete: (id: string) => void

  // Schools
  addSchool: (school: Omit<School, 'id'>) => void
  updateSchool: (id: string, school: Partial<School>) => void
  deleteSchool: (id: string) => void
  moveSchoolToOnHold: (id: string) => void
  moveSchoolToActive: (id: string) => void

  // Materials
  addMaterial: (material: Omit<Material, 'id'>) => void
  updateMaterial: (id: string, material: Partial<Material>) => void
  deleteMaterial: (id: string) => void

  // Professors
  addProfessor: (professor: Omit<Professor, 'id'>) => void
  updateProfessor: (id: string, professor: Partial<Professor>) => void
  deleteProfessor: (id: string) => void

  // Documents
  addDocument: (document: Omit<Document, 'id' | 'updatedAt'>) => void
  updateDocument: (id: string, document: Partial<Document>) => void
  deleteDocument: (id: string) => void

  // Recommenders
  addRecommender: (recommender: Omit<Recommender, 'id'>) => void
  updateRecommender: (id: string, recommender: Partial<Recommender>) => void
  deleteRecommender: (id: string) => void

  // Interviews
  addInterview: (interview: Omit<Interview, 'id'>) => void
  updateInterview: (id: string, interview: Partial<Interview>) => void
  deleteInterview: (id: string) => void

  // Import / Export
  exportData: () => string
  importData: (json: string) => void
  resetData: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      schools: seedSchools,
      materials: seedMaterials,
      professors: seedProfessors,
      documents: seedDocuments,
      recommenders: seedRecommenders,
      interviews: seedInterviews,
      trash: [],
      restoreFromTrash: (id) => set(state => restoreTrash(state, id)),
      permanentlyDelete: (id) => set(state => ({ trash: state.trash.filter(entry => entry.id !== id) })),

      addSchool: (school) =>
        set((state) => ({ schools: [...state.schools, { ...school, id: generateId() }] })),
      updateSchool: (id, school) =>
        set((state) => ({
          schools: state.schools.map((s) => (s.id === id ? { ...s, ...school } : s)),
        })),
      deleteSchool: (id) =>
        set(state => moveToTrash(state, 'schools', id, generateId())),
      moveSchoolToOnHold: (id) =>
        set((state) => ({
          schools: state.schools.map((s) => (s.id === id ? { ...s, status: 'on-hold' as const } : s)),
        })),
      moveSchoolToActive: (id) =>
        set((state) => ({
          schools: state.schools.map((s) => (s.id === id ? { ...s, status: 'active' as const } : s)),
        })),

      addMaterial: (material) =>
        set((state) => ({ materials: [...state.materials, { ...material, id: generateId() }] })),
      updateMaterial: (id, material) =>
        set((state) => ({
          materials: state.materials.map((m) => (m.id === id ? { ...m, ...material } : m)),
        })),
      deleteMaterial: (id) =>
        set(state => moveToTrash(state, 'materials', id, generateId())),

      addProfessor: (professor) =>
        set((state) => ({ professors: [...state.professors, { ...professor, id: generateId() }] })),
      updateProfessor: (id, professor) =>
        set((state) => ({
          professors: state.professors.map((p) => (p.id === id ? { ...p, ...professor } : p)),
        })),
      deleteProfessor: (id) =>
        set(state => moveToTrash(state, 'professors', id, generateId())),

      addDocument: (document) =>
        set((state) => ({
          documents: [
            ...state.documents,
            { ...document, id: generateId(), updatedAt: new Date().toISOString() },
          ],
        })),
      updateDocument: (id, document) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...document, updatedAt: new Date().toISOString() } : d
          ),
        })),
      deleteDocument: (id) =>
        set(state => moveToTrash(state, 'documents', id, generateId())),

      addRecommender: (recommender) =>
        set((state) => ({
          recommenders: [...state.recommenders, { ...recommender, id: generateId() }],
        })),
      updateRecommender: (id, recommender) =>
        set((state) => ({
          recommenders: state.recommenders.map((r) => (r.id === id ? { ...r, ...recommender } : r)),
        })),
      deleteRecommender: (id) =>
        set(state => moveToTrash(state, 'recommenders', id, generateId())),

      addInterview: (interview) =>
        set((state) => ({ interviews: [...state.interviews, { ...interview, id: generateId() }] })),
      updateInterview: (id, interview) =>
        set((state) => ({
          interviews: state.interviews.map((i) => (i.id === id ? { ...i, ...interview } : i)),
        })),
      deleteInterview: (id) =>
        set(state => moveToTrash(state, 'interviews', id, generateId())),

      exportData: () => {
        const state = get()
        return JSON.stringify(
          {
            schools: state.schools,
            materials: state.materials,
            professors: state.professors,
            documents: state.documents,
            recommenders: state.recommenders,
            interviews: state.interviews,
            trash: state.trash,
          },
          null,
          2
        )
      },
      importData: (json) => {
        try {
          set(parseData(JSON.parse(json)))
        } catch (error) {
          alert(`导入失败：${error instanceof Error ? error.message : 'JSON 格式错误'}`)
        }
      },
      resetData: () =>
        set({
          schools: seedSchools,
          materials: seedMaterials,
          professors: seedProfessors,
          documents: seedDocuments,
          recommenders: seedRecommenders,
          interviews: seedInterviews,
        }),
    }),
    {
      name: 'phd-tracker-storage',
      // Cloud accounts use isolated durable caches; never overwrite the legacy guest backup.
      storage: createJSONStorage(() => cloudConfigured ? {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } : localStorage),
    }
  )
)
