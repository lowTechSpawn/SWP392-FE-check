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
  Info,
  PlusCircle,
  CalendarDays,
  BookOpen,
  Layers,
  X,
  Clock,
  ClipboardList,
  Edit3,
  Trash2,
  Plus,
  Settings
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
import { type User } from '@/types/user'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { systemService, type RoleResponse, type GenreResponse } from '@/services/systemService'

export default function AdminPage() {
  const { role } = useRole()
  const [mounted, setMounted] = useState(false)

  // State variables
  const [usersList, setUsersList] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'system'>('list')

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
  const [formRoleId, setFormRoleId] = useState('')
  const [formEditorId, setFormEditorId] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formConfirmPassword, setFormConfirmPassword] = useState('')

  // --- States for System Management (Roles/Genres CRUD) ---
  const [rolesList, setRolesList] = useState<RoleResponse[]>([])
  const [genresList, setGenresList] = useState<GenreResponse[]>([])
  const [systemLoading, setSystemLoading] = useState(false)

  const [roleSearch, setRoleSearch] = useState('')
  const [genreSearch, setGenreSearch] = useState('')

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null)
  const [formRoleName, setFormRoleName] = useState('')

  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null)
  const [formGenreTitle, setFormGenreTitle] = useState('')

  // Fetch Roles and Genres from Backend
  const refreshRolesAndGenres = async () => {
    setSystemLoading(true)
    try {
      const [rData, gData] = await Promise.all([
        systemService.getRoles(),
        systemService.getGenres()
      ])
      setRolesList(rData)
      setGenresList(gData)
      if (rData.length > 0) {
        const defaultRole = rData.find(r => r.roleName.toLowerCase() === 'mangaka') || rData[0]
        setFormRoleId(defaultRole.roleId)
      }
    } catch (err: any) {
      console.error("Failed to fetch roles or genres from backend", err)
      toast.error("Không thể tải danh sách vai trò hoặc thể loại từ hệ thống.")
      setRolesList([])
      setGenresList([])
      setFormRoleId('')
    } finally {
      setSystemLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'system') {
      refreshRolesAndGenres()
    }
  }, [activeTab])

  useEffect(() => {
    setMounted(true)
    refreshUsers()
    refreshRolesAndGenres()
  }, [])

  const refreshUsers = async () => {
    try {
      const response = await userService.getUsers()
      if (response && response.data) {
        const mappedUsers: User[] = response.data.map((u) => {
          const id = u.userId || "default"
          const code = id.charCodeAt(id.length - 1) || 0
          const role = u.roleName as any
          const status = u.deletedAt === null ? 'Active' : 'Inactive'

          const localUser: User = {
            id: u.userId,
            username: u.userName,
            name: u.displayName,
            email: u.email,
            role,
            status,
            avatarUrl: (u as any).avatarUrl || undefined,
            editorId: u.assignedEditorId || undefined,
            createdAt: u.createdAt
          }

          return localUser
        })

        setUsersList(mappedUsers)
      }
    } catch (err) {
      console.error("Failed to fetch users from backend", err)
      toast.error("Không thể kết nối API để lấy danh sách người dùng.")
    }
  }

  // Get available Editors for dropdown
  const editors = useMemo(() => {
    return usersList.filter(u => u.role === 'TantouEditor' && u.status === 'Active')
  }, [usersList])

  // Look up editor name helper
  const getEditorName = (editorId?: string) => {
    if (!editorId) return 'Chưa gán'
    const ed = usersList.find(u => u.id === editorId)
    return ed ? ed.name : 'Không xác định'
  }

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList
      .filter(u => {
        const matchSearch =
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchRole = roleFilter === 'all' || u.role === roleFilter
        const matchStatus = statusFilter === 'all' || u.status === statusFilter

        return matchSearch && matchRole && matchStatus
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
  }, [usersList, searchTerm, roleFilter, statusFilter])

  // Handle account status toggle (Active/Inactive)
  const handleToggleStatus = async (userId: string, currentStatus: 'Active' | 'Inactive') => {
    if (currentStatus === 'Active') {
      try {
        await userService.deleteUser(userId)
        toast.success('Đã khóa tài khoản thành công!')
        refreshUsers()
      } catch (err: any) {
        toast.error(err.message || 'Khóa tài khoản thất bại.')
      }
    }
  }

  // Handle open editor assignment modal
  const handleOpenAssignModal = (mangaka: User) => {
    setAssigningMangaka(mangaka)
    setSelectedEditorId(mangaka.editorId || '')
  }

  // Submit editor assignment
  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningMangaka) return

    try {
      await userService.assignEditorToMangaka(assigningMangaka.id, selectedEditorId)
      toast.success(`Đã gán Editor thành công cho Mangaka ${assigningMangaka.name}!`)
      setAssigningMangaka(null)
      refreshUsers()
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi khi gán Editor.')
    }
  }

  // Handle Create Account Submission (BR-01)
  const handleCreateAccount = async (e: React.FormEvent) => {
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
      const selectedRoleObj = rolesList.find(r => r.roleId === formRoleId)
      if (!selectedRoleObj) {
        toast.error('Vui lòng chọn vai trò hệ thống hợp lệ.')
        return
      }
      const selectedRoleName = selectedRoleObj.roleName
      const isMangaka = selectedRoleName.toLowerCase() === 'mangaka'

      await authService.register({
        userName: formUsername.trim(),
        email: formEmail.trim(),
        displayName: formName.trim(),
        password: formPassword,
        roleId: formRoleId,
        assignedFromUserId: isMangaka && formEditorId.trim() ? formEditorId.trim() : undefined
      })



      toast.success(`Tài khoản "${formName}" đã được tạo thành công trên Databas!`)

      // Reset Form
      setFormName('')
      setFormUsername('')
      setFormEmail('')
      const defaultRole = rolesList.find(r => r.roleName.toLowerCase() === 'mangaka') || rolesList[0]
      setFormRoleId(defaultRole?.roleId || '')
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

  // Handle Role Creation & Modification
  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRoleName.trim()) {
      toast.error('Vui lòng nhập tên vai trò!')
      return
    }

    try {
      if (editingRole) {
        await systemService.updateRole(editingRole.roleId, formRoleName.trim())
        toast.success(`Đã cập nhật vai trò thành công!`)
      } else {
        await systemService.createRole(formRoleName.trim())
        toast.success(`Đã tạo vai trò "${formRoleName}" thành công!`)
      }
      setIsRoleModalOpen(false)
      setEditingRole(null)
      setFormRoleName('')
      refreshRolesAndGenres()
    } catch (err: any) {
      toast.error(err.message || 'Thao tác vai trò thất bại.')
    }
  }

  // Handle Role Delete (soft-delete)
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleName}" không?`)) return
    try {
      await systemService.deleteRole(roleId)
      toast.success(`Đã xóa vai trò "${roleName}" thành công!`)
      refreshRolesAndGenres()
    } catch (err: any) {
      toast.error(err.message || 'Xóa vai trò thất bại.')
    }
  }

  // Handle Genre Creation & Modification
  const handleGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formGenreTitle.trim()) {
      toast.error('Vui lòng nhập tên thể loại!')
      return
    }

    try {
      if (editingGenre) {
        await systemService.updateGenre(editingGenre.genreId, formGenreTitle.trim())
        toast.success(`Đã cập nhật thể loại thành công!`)
      } else {
        await systemService.createGenre(formGenreTitle.trim())
        toast.success(`Đã tạo thể loại "${formGenreTitle}" thành công!`)
      }
      setIsGenreModalOpen(false)
      setEditingGenre(null)
      setFormGenreTitle('')
      refreshRolesAndGenres()
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thể loại thất bại.')
    }
  }

  // Handle Genre Delete (soft-delete)
  const handleDeleteGenre = async (genreId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thể loại "${title}" không?`)) return
    try {
      await systemService.deleteGenre(genreId)
      toast.success(`Đã xóa thể loại "${title}" thành công!`)
      refreshRolesAndGenres()
    } catch (err: any) {
      toast.error(err.message || 'Xóa thể loại thất bại.')
    }
  }

  const selectedFormRoleName = useMemo(() => {
    return rolesList.find(r => r.roleId === formRoleId)?.roleName || ''
  }, [rolesList, formRoleId])

  const isMangakaSelected = selectedFormRoleName.toLowerCase() === 'mangaka'

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
          Chỉ tài khoản hoạt động với vai trò <strong>Admin</strong> mới được phép truy cập trang này.
        </p>
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
            {role === 'Admin' ? 'Quản trị Tài khoản' : 'Danh sách Thành viên'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === 'Admin'
              ? 'Thiết lập tài khoản nội bộ và phân quyền vai trò cho hệ thống (BR-01)'
              : 'Xem danh sách tác giả, trợ lý vẽ và biên tập viên phụ trách trong hệ thống'}
          </p>
        </div>

        {/* Tab Buttons (Only for Admin) */}
        {role === 'Admin' && (
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl shrink-0 w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <Users className="w-3.5 h-3.5" /> Danh sách Tài khoản
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'create'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Tạo Tài khoản mới
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'system'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
            >
              <Layers className="w-3.5 h-3.5" /> Quản lý Hệ thống
            </button>
          </div>
        )}
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
                <option value="TantouEditor">Tantou Editor</option>
                <option value="EditorialBoard">Editorial Board</option>
                <option value="EditorInChief">Editor-in-Chief</option>
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
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Ngày tạo</TableHead>
                    {role === 'Admin' && <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Editor Phụ Trách</TableHead>}
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Trạng thái</TableHead>
                    <TableHead className="w-32 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={role === 'Admin' ? 9 : 8} className="p-12 text-center text-muted-foreground space-y-2">
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
                      else if (user.role === 'TantouEditor') roleBadgeClass = 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                      else if (user.role === 'EditorialBoard') roleBadgeClass = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                      else if (user.role === 'EditorInChief') roleBadgeClass = 'bg-red-500/10 text-red-600 border-red-500/20'

                      return (
                        <TableRow key={user.id} className="border-b border-border hover:bg-muted/15 transition-colors">
                          {/* Avatar */}
                          <TableCell className="flex justify-center py-2.5">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-border">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </TableCell>

                          {/* Name & ID */}
                          <TableCell className="font-bold text-foreground py-2.5">
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                            </div>
                          </TableCell>

                          {/* Username */}
                          <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">{user.username}</TableCell>

                          {/* Email */}
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400">{user.email}</TableCell>

                          {/* Role */}
                          <TableCell>
                            <Badge className={`${roleBadgeClass} font-bold text-[10px] px-2.5 py-0.5 rounded-full border`}>
                              {user.role}
                            </Badge>
                          </TableCell>

                          {/* Created At */}
                          <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }) : '—'}
                          </TableCell>

                          {/* Assigned Editor */}
                          {role === 'Admin' && (
                            <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                          )}

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
                            {user.role === 'Admin' ? (
                              <span className="text-[10px] text-muted-foreground italic">Admin</span>
                            ) : user.status === 'Active' ? (
                              <Button
                                onClick={() => handleToggleStatus(user.id, user.status || 'Active')}
                                variant="outline"
                                className="text-[10px] font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex items-center gap-1 mx-auto hover:bg-rose-500/10 hover:text-rose-600 border-rose-500/20 text-rose-500/80"
                              >
                                <UserX className="w-3 h-3" /> Khóa tài khoản
                              </Button>
                            ) : (
                              <span className="text-[10px] text-rose-600/85 font-semibold">Đã khóa</span>
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
      ) : activeTab === 'create' ? (
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
                  value={formRoleId}
                  onChange={(e) => {
                    setFormRoleId(e.target.value)
                    setFormEditorId('')
                  }}
                  className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
                >
                  <option value="" disabled>-- Chọn Vai Trò --</option>
                  {rolesList.map(r => (
                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                  ))}
                </select>
              </div>

              {/* Conditionally Render Editor Assignment Dropdown (if role === Mangaka) */}
              {isMangakaSelected && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Chọn Tantou Editor Phụ Trách <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formEditorId}
                    onChange={(e) => setFormEditorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground cursor-pointer focus:border-primary/50"
                    required
                  >
                    <option value="">-- Chọn Tantou Editor --</option>
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
              Tạo tài khoản mới
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Roles Management Card */}
            <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Quản lý Vai trò</h2>
                    <p className="text-xs text-muted-foreground">Phân quyền vai trò hệ thống</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingRole(null);
                    setFormRoleName('');
                    setIsRoleModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm vai trò
                </Button>
              </div>

              {/* Search Roles */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <input
                  type="text"
                  placeholder="Tìm kiếm vai trò..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-muted/50 border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Roles Table */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/10 max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/30 border-b border-border">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Tên Vai trò</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground w-1/3">UUID</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-24">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {systemLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground">
                          Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    ) : rolesList.filter(r => r.roleName.toLowerCase().includes(roleSearch.toLowerCase())).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground italic">
                          Không tìm thấy vai trò nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rolesList
                        .filter(r => r.roleName.toLowerCase().includes(roleSearch.toLowerCase()))
                        .map((r) => (
                          <TableRow key={r.roleId} className="border-b border-border hover:bg-muted/10 transition-colors">
                            <TableCell className="font-bold text-xs text-foreground py-3">{r.roleName}</TableCell>
                            <TableCell className="text-[10px] font-mono text-muted-foreground py-3 max-w-[120px] truncate" title={r.roleId}>
                              {r.roleId}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingRole(r);
                                    setFormRoleName(r.roleName);
                                    setIsRoleModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-muted border border-transparent hover:border-border rounded-lg text-slate-400 hover:text-foreground transition-all cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRole(r.roleId, r.roleName)}
                                  className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Genres Management Card */}
            <Card className="p-6 bg-card border border-border rounded-2xl shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Quản lý Thể loại</h2>
                    <p className="text-xs text-muted-foreground">Cấu hình thể loại manga</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingGenre(null);
                    setFormGenreTitle('');
                    setIsGenreModalOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm thể loại
                </Button>
              </div>

              {/* Search Genres */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thể loại..."
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-muted/50 border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Genres Table */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/10 max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/30 border-b border-border">
                    <TableRow>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Tên Thể loại</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground w-1/4">Trạng thái</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-24">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {systemLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground">
                          Đang tải dữ liệu...
                        </TableCell>
                      </TableRow>
                    ) : genresList.filter(g => g.title.toLowerCase().includes(genreSearch.toLowerCase())).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground italic">
                          Không tìm thấy thể loại nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      genresList
                        .filter(g => g.title.toLowerCase().includes(genreSearch.toLowerCase()))
                        .map((g) => (
                          <TableRow key={g.genreId} className="border-b border-border hover:bg-muted/10 transition-colors">
                            <TableCell className="font-bold text-xs text-foreground py-3">{g.title}</TableCell>
                            <TableCell className="py-3">
                              {g.deletedAt ? (
                                <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                  Đã ẩn (Deleted)
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                  Kích hoạt (Active)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingGenre(g);
                                    setFormGenreTitle(g.title);
                                    setIsGenreModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-muted border border-transparent hover:border-border rounded-lg text-slate-400 hover:text-foreground transition-all cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGenre(g.genreId, g.title)}
                                  className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                                  title="Xóa"
                                  disabled={g.deletedAt !== null}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

          </div>
        </div>
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

      {/* Role Add/Edit Dialog Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={(open) => !open && setIsRoleModalOpen(false)}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              {editingRole ? `Cập nhật vai trò "${editingRole.roleName}"` : 'Thêm vai trò mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRoleSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên vai trò <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Moderator, Translator..."
                value={formRoleName}
                onChange={(e) => setFormRoleName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                variant="outline"
                className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
              >
                {editingRole ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Genre Add/Edit Dialog Modal */}
      <Dialog open={isGenreModalOpen} onOpenChange={(open) => !open && setIsGenreModalOpen(false)}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              {editingGenre ? `Cập nhật thể loại "${editingGenre.title}"` : 'Thêm thể loại mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGenreSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên thể loại <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Comedy, Isekai..."
                value={formGenreTitle}
                onChange={(e) => setFormGenreTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                onClick={() => setIsGenreModalOpen(false)}
                variant="outline"
                className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
              >
                {editingGenre ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
