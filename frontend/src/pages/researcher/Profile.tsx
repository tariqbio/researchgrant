import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { userApi } from '../../api'
import { RESEARCH_AREAS, ELIGIBILITY_TYPES } from '../../types'
import { slugToLabel } from '../../utils'

type Tab = 'profile' | 'alerts'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState<Tab>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [institution, setInstitution] = useState(user?.institution ?? '')
  const [designation, setDesignation] = useState(user?.designation ?? '')
  const [language, setLanguage] = useState(user?.preferred_language ?? 'en')

  // Interests
  const [interests, setInterests] = useState<string[]>(user?.research_interests ?? [])

  // Alert settings
  const [alertsEnabled, setAlertsEnabled] = useState(user?.email_alerts_enabled ?? true)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setInstitution(user.institution ?? '')
      setDesignation(user.designation ?? '')
      setLanguage(user.preferred_language)
      setInterests(user.research_interests)
      setAlertsEnabled(user.email_alerts_enabled)
    }
  }, [user])

  const toggleInterest = (slug: string) => {
    setInterests(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await userApi.update({
        full_name: fullName,
        institution,
        designation,
        preferred_language: language as 'en' | 'bn',
        research_interests: interests,
        email_alerts_enabled: alertsEnabled,
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile & interests' },
    { id: 'alerts', label: 'Alert settings' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-medium text-gray-900 mb-4">Account</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-emerald-600 text-emerald-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-5">
          {/* Personal info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Personal information</h2>
            <div className="space-y-3">
              {[
                { label: 'Full name', value: fullName, set: setFullName, placeholder: 'Dr. Ariful Rahman' },
                { label: 'Institution', value: institution, set: setInstitution, placeholder: 'Daffodil International University' },
                { label: 'Designation', value: designation, set: setDesignation, placeholder: 'Associate Professor' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Preferred language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 bg-white"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Research interests */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-sm font-medium text-gray-900">Research interests</h2>
              <span className="text-xs text-gray-400">{interests.length} selected</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              These drive your grant alert matches. Select everything relevant to your work.
            </p>

            {/* Selected tags at top */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-100">
                {interests.map(slug => (
                  <button
                    key={slug}
                    onClick={() => toggleInterest(slug)}
                    className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                  >
                    ✓ {RESEARCH_AREAS[slug] ?? slugToLabel(slug)}
                    <span className="text-emerald-400 ml-0.5">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* All areas grouped */}
            {[
              {
                label: 'Life & agricultural sciences',
                slugs: ['biotechnology', 'life_sciences', 'agriculture', 'crop_science', 'soil_science', 'food_technology', 'fisheries', 'veterinary', 'medicine', 'pharmacy', 'public_health'],
              },
              {
                label: 'Engineering & technology',
                slugs: ['engineering', 'civil_engineering', 'mechanical_engineering', 'electrical_engineering', 'chemical_engineering', 'ict', 'software_engineering', 'data_science', 'ai_ml', 'renewable_energy'],
              },
              {
                label: 'Environment & physical sciences',
                slugs: ['climate_environment', 'water_resources', 'chemistry', 'physics', 'mathematics'],
              },
              {
                label: 'Social sciences & humanities',
                slugs: ['social_sciences', 'economics', 'education', 'urban_planning', 'architecture', 'law', 'humanities'],
              },
            ].map(group => (
              <div key={group.label} className="mb-4">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.slugs.map(slug => {
                    const selected = interests.includes(slug)
                    return (
                      <button
                        key={slug}
                        onClick={() => toggleInterest(slug)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                        }`}
                      >
                        {selected && '✓ '}{RESEARCH_AREAS[slug]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {interests.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠ Select at least one area to receive matched grant alerts.
              </p>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && <span className="text-sm text-emerald-600">✓ Saved</span>}
          </div>
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Email notifications</h2>
            <div className="space-y-0 divide-y divide-gray-50">
              {[
                {
                  label: 'Grant match alerts',
                  desc: 'Email when a new grant matches your research interests',
                  value: alertsEnabled,
                  set: setAlertsEnabled,
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      item.value ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      item.value ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Alert preview */}
          {interests.length > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">Your alerts will cover</p>
              <div className="space-y-1">
                {interests.map(slug => (
                  <div key={slug} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-emerald-500">✓</span>
                    {RESEARCH_AREAS[slug] ?? slugToLabel(slug)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          {saved && <span className="text-sm text-emerald-600 ml-3">✓ Saved</span>}
        </div>
      )}
    </div>
  )
}
