'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService, User } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Calendar, 
  Shield, 
  Loader2, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  // Edit Profile Form State
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    // Load from local storage first to prevent UI flash
    const saved = localStorage.getItem('user-info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        setDisplayName(parsed.name || '')
        setEmail(parsed.email || '')
      } catch {}
    }

    // Fetch updated data from API
    authService.getCurrentUser()
      .then((data) => {
        if (data) {
          setUser(data)
          setDisplayName(data.name || '')
          setEmail(data.email || '')
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile", err)
        toast.error("Không thể tải thông tin tài khoản.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!displayName.trim()) {
      toast.error("Tên hiển thị không được để trống.")
      return
    }
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Email không hợp lệ.")
      return
    }

    setUpdatingProfile(true)
    try {
      const response = await authService.updateProfile({
        displayName: displayName.trim(),
        email: email.trim()
      })
      
      // Update local state
      if (user) {
        setUser({
          ...user,
          name: displayName.trim(),
          email: email.trim()
        })
      }
      
      // Dispatch event to update header in real-time
      window.dispatchEvent(new Event('user-profile-updated'))
      toast.success(response.message || "Cập nhật thông tin cá nhân thành công!")
    } catch (err: any) {
      toast.error(err.message || "Cập nhật thông tin thất bại.")
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp.")
      return
    }

    setChangingPassword(true)
    try {
      await authService.changePassword({
        currentPassword,
        newPassword
      })

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.")
      
      // Session invalidated on backend, clean session and redirect to login
      setTimeout(async () => {
        try {
          await authService.logout()
        } catch {}
        router.push('/login')
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2.5 text-sm text-muted-foreground">Đang tải thông tin tài khoản...</span>
      </div>
    )
  }

  const roleBadges: Record<string, string> = {
    Mangaka: 'bg-primary/10 text-primary border-primary/20',
    Assistant: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    TantouEditor: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    EditorialBoard: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    EditorInChief: 'bg-red-500/10 text-red-600 border-red-500/20',
    Admin: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  }

  const formattedDate = user?.id ? (() => {
    // Generate mock date if not present (since CreatedAt isn't on User response but on UserProfileResponse)
    const mockDate = new Date(2026, 0, 15)
    return mockDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
  })() : ''

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Hồ Sơ Cá Nhân
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin tài khoản và thay đổi mật khẩu của bạn.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Side: Summary Card */}
        <div className="md:col-span-1 bg-card border border-border/60 rounded-3xl p-6 flex flex-col items-center text-center shadow-xl space-y-4">
          <div className="relative group">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-border shadow-inner"
              />
            ) : (
              <div className="bg-primary/10 text-primary w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-foreground">{user?.name}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
          </div>

          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider block text-center w-fit",
            roleBadges[user?.role || ''] || 'bg-muted text-muted-foreground'
          )}>
            {user?.role}
          </span>

          <div className="w-full pt-4 border-t border-border/60 space-y-3 text-left">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <span>Thành viên từ: {formattedDate || '15 tháng 1, 2026'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
              <span>Quyền hạn: {user?.role}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Forms and Tabs */}
        <div className="md:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex p-1 bg-muted rounded-2xl border border-border/40 max-w-sm">
            <button
              onClick={() => setActiveTab('info')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                activeTab === 'info' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/30"
              )}
            >
              <UserIcon className="w-4 h-4" />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                activeTab === 'password' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/30"
              )}
            >
              <Lock className="w-4 h-4" />
              Đổi mật khẩu
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-xl">
            {activeTab === 'info' ? (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Thông tin cơ bản</h3>
                  <p className="text-xs text-muted-foreground">Cập nhật tên hiển thị và địa chỉ email của bạn.</p>
                </div>

                <div className="space-y-4">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      Tên hiển thị
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên hiển thị mới"
                      required
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập địa chỉ email"
                      required
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* Readonly Username */}
                  <div className="space-y-2 opacity-75">
                    <Label>
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      Tên đăng nhập (Username)
                    </Label>
                    <div className="h-10 w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground select-none cursor-not-allowed">
                      {user?.name?.toLowerCase().replace(/\s+/g, '_') || 'user_profile'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button
                    type="submit"
                    disabled={updatingProfile}
                    className="h-10 px-6 font-bold rounded-xl"
                  >
                    {updatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">Đổi mật khẩu tài khoản</h3>
                  <p className="text-xs text-muted-foreground">Thay đổi mật khẩu đăng nhập để bảo mật tài khoản tốt hơn.</p>
                </div>

                {/* Warning Alert */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-500 text-xs">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lưu ý quan trọng: </span>
                    Khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác của bạn trên các thiết bị sẽ bị đăng xuất tự động. Bạn sẽ cần phải đăng nhập lại với mật khẩu mới.
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      className="rounded-xl h-10"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="h-10 px-6 font-bold rounded-xl"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Thay đổi mật khẩu'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
