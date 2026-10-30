import { Plus } from 'lucide-react'
import React from 'react'
import { useAuth } from '../../../context/useAuth'
import { PERMISSIONS } from '../../../constants/permissions'

const TourHeader = ({onAdd}) => {
  const { can } = useAuth()

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className="">
            <h1 className="text-3xl font-bold text-slate-900">
                Tours
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                Menage all tours and itineraries
            </p>
        </div>
        {can(PERMISSIONS.STORE_TOURS) && (
          <button onClick={onAdd} className='flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700'>
              <Plus size={18}/>
              Add Tour
          </button>
        )}
    </div>
  )
}

export default TourHeader
