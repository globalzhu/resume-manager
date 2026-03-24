import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { ArrowLeft, Save, Trash2, Mic, MicOff } from 'lucide-react'

export default function MobileProfileForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState({
    name: '',
    description: '',
    education_requirement: '',
    experience_min: 0,
    experience_max: 0,
    skills_required: '',
    skills_preferred: '',
    personality_traits: '',
    certifications: '',
    notes: '',
  })
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordTarget, setRecordTarget] = useState(null)

  useEffect(() => {
    if (!isNew) {
      api.getProfile(id).then(data => {
        setForm({
          ...data,
          skills_required: (data.skills_required || []).join(', '),
          skills_preferred: (data.skills_preferred || []).join(', '),
          personality_traits: (data.personality_traits || []).join(', '),
          certifications: (data.certifications || []).join(', '),
        })
      })
    }
  }, [id, isNew])

  const handleSave = async (e) => {
    e.preventDefault()
    const data = {
      ...form,
      skills_required: form.skills_required ? String(form.skills_required).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
      skills_preferred: form.skills_preferred ? String(form.skills_preferred).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
      personality_traits: form.personality_traits ? String(form.personality_traits).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
      certifications: form.certifications ? String(form.certifications).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
    }
    try {
      if (isNew) {
        const profile = await api.createProfile(data)
        navigate(`/profiles/${profile.id}/edit`, { replace: true })
      } else {
        await api.updateProfile(id, data)
      }
      alert('保存成功')
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除？')) return
    await api.deleteProfile(id)
    navigate('/positions')
  }

  const startRecording = async (field) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        try {
          const res = await api.speechToText(file)
          if (res.text) {
            setForm(prev => ({ ...prev, [field]: prev[field] ? prev[field] + ' ' + res.text : res.text }))
          } else if (res.error) {
            alert(res.error)
          }
        } catch (err) {
          alert('语音转文字失败')
        }
        setRecording(false)
        setMediaRecorder(null)
        setRecordTarget(null)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordTarget(field)
      setRecording(true)
    } catch (err) {
      alert('无法访问麦克风')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }

  const VoiceBtn = ({ field }) => (
    <button type="button"
      onClick={() => recording && recordTarget === field ? stopRecording() : startRecording(field)}
      className={`p-1 rounded transition ${recording && recordTarget === field ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
      {recording && recordTarget === field ? <MicOff size={12} /> : <Mic size={12} />}
    </button>
  )

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-white/5 text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">
          {isNew ? '新建画像' : '编辑画像'}
        </h1>
        {!isNew && (
          <button onClick={handleDelete} className="p-2 rounded-lg bg-white/5 text-red-400">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">画像名称 * <VoiceBtn field="name" /></label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="例: 高级前端工程师"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">描述 <VoiceBtn field="description" /></label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="描述理想候选人..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">学历</label>
              <select value={form.education_requirement} onChange={e => setForm({ ...form, education_requirement: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                <option value="">不限</option>
                <option value="大专">大专</option>
                <option value="本科">本科</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">经验(年)</label>
              <div className="flex gap-1 items-center">
                <input type="number" min="0" step="0.5" value={form.experience_min} onChange={e => setForm({ ...form, experience_min: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                <span className="text-slate-500 text-xs">-</span>
                <input type="number" min="0" step="0.5" value={form.experience_max} onChange={e => setForm({ ...form, experience_max: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">必需技能 <VoiceBtn field="skills_required" /></label>
            <input value={form.skills_required} onChange={e => setForm({ ...form, skills_required: e.target.value })}
              placeholder="逗号分隔: Python, React..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">优先技能 <VoiceBtn field="skills_preferred" /></label>
            <input value={form.skills_preferred} onChange={e => setForm({ ...form, skills_preferred: e.target.value })}
              placeholder="逗号分隔: Docker, AWS..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">性格特征 <VoiceBtn field="personality_traits" /></label>
            <input value={form.personality_traits} onChange={e => setForm({ ...form, personality_traits: e.target.value })}
              placeholder="逗号分隔: 团队合作, 自驱力强..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">证书 <VoiceBtn field="certifications" /></label>
            <input value={form.certifications} onChange={e => setForm({ ...form, certifications: e.target.value })}
              placeholder="逗号分隔: PMP, CPA..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">备注 <VoiceBtn field="notes" /></label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none resize-none" />
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium flex items-center justify-center gap-2">
          <Save size={14} /> 保存画像
        </button>
      </form>
    </div>
  )
}
