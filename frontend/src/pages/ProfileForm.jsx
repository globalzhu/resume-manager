import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, Save, Trash2, Mic, MicOff } from 'lucide-react'

export default function ProfileForm() {
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
        navigate(`/profiles/${profile.id}/edit`)
      } else {
        await api.updateProfile(id, data)
      }
      alert('保存成功')
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除该画像？')) return
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
            setForm(prev => ({
              ...prev,
              [field]: prev[field] ? prev[field] + ' ' + res.text : res.text,
            }))
          } else if (res.error) {
            alert(res.error)
          }
        } catch (err) {
          alert('语音转文字失败: ' + err.message)
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
      alert('无法访问麦克风: ' + err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }

  const VoiceButton = ({ field }) => (
    <button
      type="button"
      onClick={() => recording && recordTarget === field ? stopRecording() : startRecording(field)}
      className={`p-1.5 rounded-lg transition ${recording && recordTarget === field ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-500 hover:text-indigo-300 hover:bg-white/[0.06]'}`}
      title={recording && recordTarget === field ? '停止录音' : '语音输入'}
    >
      {recording && recordTarget === field ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">
          {isNew ? '新建候选人画像' : '编辑候选人画像'}
        </h1>
        {!isNew && (
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 size={14} /> 删除
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="glass rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">画像名称 * <VoiceButton field="name" /></label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="例: 高级前端工程师画像"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">画像描述 <VoiceButton field="description" /></label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="描述理想候选人的特征..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">学历要求</label>
            <select value={form.education_requirement} onChange={e => setForm({ ...form, education_requirement: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none">
              <option value="">不限</option>
              <option value="大专">大专</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">经验要求 (年)</label>
            <div className="flex gap-2 items-center">
              <input type="number" min="0" step="0.5" value={form.experience_min} onChange={e => setForm({ ...form, experience_min: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
              <span className="text-zinc-500">-</span>
              <input type="number" min="0" step="0.5" value={form.experience_max} onChange={e => setForm({ ...form, experience_max: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">必需技能 (逗号分隔) <VoiceButton field="skills_required" /></label>
            <input value={form.skills_required} onChange={e => setForm({ ...form, skills_required: e.target.value })}
              placeholder="Python, React, SQL..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">优先技能 (逗号分隔) <VoiceButton field="skills_preferred" /></label>
            <input value={form.skills_preferred} onChange={e => setForm({ ...form, skills_preferred: e.target.value })}
              placeholder="Docker, Kubernetes, AWS..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">性格特征 (逗号分隔) <VoiceButton field="personality_traits" /></label>
            <input value={form.personality_traits} onChange={e => setForm({ ...form, personality_traits: e.target.value })}
              placeholder="团队合作, 自驱力强, 沟通能力好..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">资质证书 (逗号分隔) <VoiceButton field="certifications" /></label>
            <input value={form.certifications} onChange={e => setForm({ ...form, certifications: e.target.value })}
              placeholder="PMP, CPA, AWS认证..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400 mb-1">备注 <VoiceButton field="notes" /></label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="其他要求或说明..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06]">取消</button>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110">
            <Save size={14} /> 保存
          </button>
        </div>
      </form>
    </div>
  )
}
