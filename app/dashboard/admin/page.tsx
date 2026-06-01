'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRole } from '@/context/RoleContext'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Mail,
  User as UserIcon,
  Link as LinkIcon,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Import users store utilities
import {
  getUsers,
  createUser,
  updateUserStatus,
  assignEditorToMangaka,
  type User
} from '@/lib/users-store'

export default function AdminPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)
  
  // State variables
  const [usersList, setUsersList] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  
  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Edit / Assignment Modal State
  const [assigningMangaka, setAssigningMangaka] = useState<User | null>(null)
  const [selectedEditorId, setSelectedEditorId] = useState<string>('')

  // Create Form States
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board' | 'Editor-in-Chief' | 'Admin'>('Mangaka')
  const [formEditorId, setFormEditorId] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirmPassword, setFormConfirmPassword] = useState('')

  useEffect(() => {
    setMounted(true)
    refreshUsers()
  }, [])

  const refreshUsers = () => {
    setUsersList(getUsers())
  }

  // Get available Editors for dropdown
  const editors = useMemo(() => {
    return usersList.filter(u => u.role === 'Tantou Editor' && u.status === 'Active')
  }, [usersList])

  // Look up editor name helper
  const getEditorName = (editorId?: string) => {
    if (!editorId) return 'Chưa gán'
    const ed = usersList.find(u => u.id === editorId)
    return ed ? ed.name : 'Không xác định'
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [usersList, searchTerm, roleFilter, statusFilter])

  // Handle account status toggle (Active/Inactive)
  const handleToggleStatus = (userId: string, currentStatus: 'Active' | 'Inactive') => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    const success = updateUserStatus(userId, nextStatus)
    if (success) {
      toast.success(`Đã cập nhật trạng thái tài khoản thành ${nextStatus === 'Active' ? 'Hoạt động' : 'Tạm khóa'}.`)
      refreshUsers()
    } else {
      toast.error('Cập nhật trạng thái tài khoản thất bại.')
    }
  }

  // Handle open editor assignment modal
  const handleOpenAssignModal = (mangaka: User) => {
    setAssigningMangaka(mangaka)
    setSelectedEditorId(mangaka.editorId || '')
  }

  // Submit editor assignment
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningMangaka) return

    try {
      const success = assignEditorToMangaka(assigningMangaka.id, selectedEditorId)
      if (success) {
        toast.success(`Đã gán Editor thành công cho Mangaka ${assigningMangaka.name}!`)
        setAssigningMangaka(null)
        refreshUsers()
      } else {
        toast.error('Gán Editor thất bại.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi khi gán Editor.')
    }
  }

  // Handle Create Account Submission (BR-01)
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()

    // Valdiations
    if (!formName.trim() || !formUsername.trim() || !formEmail.trim() || !formPassword) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    if (formPassword !== formConfirmPassword) {
      toast.error('Mật khẩu và xác nhận mật khẩu không khớp.')
      return
    }

    if (formPassword.length < 8) {
      toast.error('Mật khẩu phải có độ dài ít nhất 8 ký tự.')
      return
    }

    try {
      createUser({
        name: formName.trim(),
        username: formUsername.trim(),
        email: formEmail.trim(),
        role: formRole,
        editorId: formRole === 'Mangaka' && formEditorId ? formEditorId : undefined
      })

      toast.success(`Tài khoản "${formName}" đã được tạo thành công (BR-01)!`)
      
      // Reset Form
      setFormName('')
      setFormUsername('')
      setFormEmail('')
      setFormRole('Mangaka')
      setFormEditorId('')
      setFormPassword('')
      setFormConfirmPassword('')
      
      // Go back to list tab
      setActiveTab('list')
      refreshUsers()
    } catch (err: any) {
      toast.error(err.message || 'Tạo tài khoản thất bại.')
    }
  }

  if (!mounted) return null

  // Security Gate: Ensure user role is Admin to access
  if (role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-2xl max-w-md mx-auto text-center space-y-5 shadow-lg my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Shield className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chỉ tài khoản đang hoạt động với vai trò <strong>Admin</strong> mới được phép truy cập trang quản trị này.
        </p>
        <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl leading-relaxed">
          💡 Vui lòng sử dụng <strong>Bộ chọn Vai trò (Active Role Switcher)</strong> ở góc dưới bên trái Sidebar để chuyển sang vai trò <strong>Admin</strong>.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Quản trị Tài khoản
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết lập tài khoản nội bộ và phân quyền vai trò cho hệ thống (BR-01)
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl shrink-0 w-fit">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Danh sách Tài khoản
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Tạo Tài khoản mới
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search and Filters Card */}
          <Card className="p-4 border-border/80 bg-card/60 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên, Username hoặc Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Filter by Role */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">Tất cả Vai trò</option>
                <option value="Admin">Admin</option>
                <option value="Mangaka">Mangaka</option>
                <option value="Tantou Editor">Tantou Editor</option>
                <option value="Editorial Board">Editorial Board</option>
                <option value="Editor-in-Chief">Editor-in-Chief</option>
                <option value="Assistant">Assistant</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="Active">Hoạt động (Active)</option>
                <option value="Inactive">Tạm khóa (Inactive)</option>
              </select>
            </div>
          </Card>

          {/* Main User Table Card */}
          <Card className="border-border rounded-2xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border">
                  <TableRow>
                    <TableHead className="w-16 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Avatar</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Nhân viên / ID</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Tài khoản</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Email</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Vai trò</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Editor Phụ Trách</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Trạng thái</TableHead>
                    <TableHead className="w-32 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-12 text-center text-muted-foreground space-y-2">
                        <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
                        <p className="text-xs">Không tìm thấy tài khoản nào phù hợp với bộ lọc.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      // Determine badge styles for roles
                      let roleBadgeClass = 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                      if (user.role === 'Admin') roleBadgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      else if (user.role === 'Mangaka') roleBadgeClass = 'bg-primary/10 text-primary border-primary/20'
                      else if (user.role === 'Tantou Editor') roleBadgeClass = 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                      else if (user.role === 'Editorial Board') roleBadgeClass = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      else if (user.role === 'Editor-in-Chief') roleBadgeClass = 'bg-red-500/10 text-red-600 border-red-500/20'

                      return (
                        <TableRow key={user.id} className="border-b border-border hover:bg-muted/15 transition-colors">
                          {/* Avatar */}
                          <TableCell className="flex justify-center py-2.5">
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-border"
                            />
                          </TableCell>

                          {/* Name & ID */}
                          <TableCell className="font-bold text-foreground py-2.5">
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                            </div>
                          </TableCell>

                          {/* Username */}
                          <TableCell className="text-xs font-mono text-slate-350">{user.username}</TableCell>

                          {/* Email */}
                          <TableCell className="text-xs text-slate-350">{user.email}</TableCell>

                          {/* Role */}
                          <TableCell>
                            <Badge className={`${roleBadgeClass} font-bold text-[10px] px-2.5 py-0.5 rounded-full border`}>
                              {user.role}
                            </Badge>
                          </TableCell>

                          {/* Assigned Editor */}
                          <TableCell className="text-xs font-semibold text-slate-300">
                            {user.role === 'Mangaka' ? (
                              <div className="flex items-center gap-1.5">
                                <span>{getEditorName(user.editorId)}</span>
                                <button
                                  onClick={() => handleOpenAssignModal(user)}
                                  className="text-[10px] text-primary hover:underline font-bold"
                                >
                                  (Thay đổi)
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {user.status === 'Active' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Blocked
                              </Badge>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-center">
                            {user.id === 'U10' ? (
                              <span className="text-[10px] text-muted-foreground italic">Hệ thống</span>
                            ) : (
                              <Button
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                variant="outline"
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center gap-1 mx-auto ${
                                  user.status === 'Active'
                                    ? 'hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/20 text-rose-500/80'
                                    : 'hover:bg-emerald-500/10 hover:text-emerald-600 border-emerald-500/20 text-emerald-500/80'
                                }`}
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <UserX className="w-3 h-3" /> Tạm khóa
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3" /> Mở khóa
                                  </>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto p-6 bg-card border border-border rounded-2xl shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Tạo tài khoản người dùng mới</h2>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> Họ và tên <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Takeshi Obata"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                  required
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> Username <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: obata_mangaka"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                placeholder="Ví dụ: obata@mangaflow.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Vai trò hệ thống <span className="text-destructive">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    setFormRole(e.target.value as any)
                    setFormEditorId('')
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
                >
                  <option value="Mangaka">Mangaka</option>
                  <option value="Tantou Editor">Tantou Editor</option>
                  <option value="Editorial Board">Editorial Board</option>
                  <option value="Editor-in-Chief">Editor-in-Chief</option>
                  <option value="Assistant">Assistant</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Conditionally Render Editor Assignment Dropdown (if role === Mangaka) */}
              {formRole === 'Mangaka' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Tantou Editor Phụ Trách
                  </label>
                  <select
                    value={formEditorId}
                    onChange={(e) => setFormEditorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
                  >
                    <option value="">-- Chưa gán Editor --</option>
                    {editors.map(ed => (
                      <option key={ed.id} value={ed.id}>{ed.name} ({ed.username})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mật khẩu <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground focus:border-primary/50"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Xác nhận Mật khẩu <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground focus:border-primary/50"
                  required
                />
              </div>
            </div>

            {/* Create Button */}
            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl mt-4 cursor-pointer transition-all"
            >
              Tạo tài khoản mới (BR-01)
            </Button>
          </form>
        </Card>
      )}

      {/* Editor Assignment Dialog Modal */}
      <Dialog open={assigningMangaka !== null} onOpenChange={(open) => !open && setAssigningMangaka(null)}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Gán Tantou Editor Phụ Trách
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmAssignment} className="space-y-4 pt-3">
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 text-xs space-y-1.5">
              <p className="text-muted-foreground">Mangaka được chọn:</p>
              <p className="font-bold text-foreground text-sm">{assigningMangaka?.name} ({assigningMangaka?.email})</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Chọn Tantou Editor
              </label>
              <select
                value={selectedEditorId}
                onChange={(e) => setSelectedEditorId(e.target.value)}
                className="w-full px-3 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer"
              >
                <option value="">-- Hủy gán Editor --</option>
                {editors.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.name} ({ed.username})</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl mt-2 cursor-pointer transition-all">
              Xác nhận Gán Biên Tập Viên
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rules Footnote */}
      <div className="flex items-start gap-2.5 p-4 bg-muted/30 border border-border/40 rounded-2xl text-[11px] text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-foreground">Quy tắc nghiệp vụ (BRs enforced):</span> BR-01 (Internal Account Provisioning - Chỉ Admin có quyền tạo tài khoản), BR-03 (Phân quyền truy cập chức năng Admin cho vai trò Admin), gán Editor trực tiếp cho Mangaka phục vụ cho flow kích hoạt Series tự động.
        </div>
      </div>
    </div>
  )
}
