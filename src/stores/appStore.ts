import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

      addSchool: (school) =>
        set((state) => ({ schools: [...state.schools, { ...school, id: generateId() }] })),
      updateSchool: (id, school) =>
        set((state) => ({
          schools: state.schools.map((s) => (s.id === id ? { ...s, ...school } : s)),
        })),
      deleteSchool: (id) =>
        set((state) => ({
          schools: state.schools.filter((s) => s.id !== id),
          materials: state.materials.filter((m) => m.schoolId !== id),
          professors: state.professors.filter((p) => p.schoolId !== id),
        })),
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
        set((state) => ({ materials: state.materials.filter((m) => m.id !== id) })),

      addProfessor: (professor) =>
        set((state) => ({ professors: [...state.professors, { ...professor, id: generateId() }] })),
      updateProfessor: (id, professor) =>
        set((state) => ({
          professors: state.professors.map((p) => (p.id === id ? { ...p, ...professor } : p)),
        })),
      deleteProfessor: (id) =>
        set((state) => ({ professors: state.professors.filter((p) => p.id !== id) })),

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
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

      addRecommender: (recommender) =>
        set((state) => ({
          recommenders: [...state.recommenders, { ...recommender, id: generateId() }],
        })),
      updateRecommender: (id, recommender) =>
        set((state) => ({
          recommenders: state.recommenders.map((r) => (r.id === id ? { ...r, ...recommender } : r)),
        })),
      deleteRecommender: (id) =>
        set((state) => ({ recommenders: state.recommenders.filter((r) => r.id !== id) })),

      addInterview: (interview) =>
        set((state) => ({ interviews: [...state.interviews, { ...interview, id: generateId() }] })),
      updateInterview: (id, interview) =>
        set((state) => ({
          interviews: state.interviews.map((i) => (i.id === id ? { ...i, ...interview } : i)),
        })),
      deleteInterview: (id) =>
        set((state) => ({ interviews: state.interviews.filter((i) => i.id !== id) })),

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
          },
          null,
          2
        )
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json)
          set({
            schools: data.schools || [],
            materials: data.materials || [],
            professors: data.professors || [],
            documents: data.documents || [],
            recommenders: data.recommenders || [],
            interviews: data.interviews || [],
          })
        } catch {
          alert('导入失败：JSON 格式错误')
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
    }
  )
)
