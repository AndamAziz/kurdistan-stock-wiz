import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useUserRoles, AppRole } from "@/hooks/useUserRoles";
import { Users, Shield, ShieldCheck, Eye, Loader2, UserPlus, Mail, User, ChevronDown, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roleLabels: Record<AppRole, string> = {
  admin: 'بەڕێوەبەر',
  storekeeper: 'کۆگادار',
  viewer: 'بینەر',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-gradient-to-r from-destructive/20 to-destructive/10 text-destructive border-destructive/30',
  storekeeper: 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30',
  viewer: 'bg-gradient-to-r from-muted to-muted/50 text-muted-foreground border-border',
};

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: ShieldCheck,
  storekeeper: Shield,
  viewer: Eye,
};

const allRoles: AppRole[] = ['admin', 'storekeeper', 'viewer'];

export default function UserRoles() {
  const {
    isAdmin,
    isLoadingCurrentUserRoles,
    usersWithRoles,
    isLoadingUsers,
    assignRole,
    removeRole,
    isAssigningRole,
    isRemovingRole,
    refetchUsers,
  } = useUserRoles();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("viewer");
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; role: AppRole } | null>(null);

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("تکایە ئیمەیڵ و وشەی نهێنی بنووسە");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت");
      return;
    }

    setIsCreating(true);
    try {
      // Use edge function to create user (prevents logout of current admin)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserName,
          role: newUserRole,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("بەکارهێنەر دروستکرا");
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRole("viewer");
      refetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : "هەڵە لە دروستکردنی بەکارهێنەر";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingCurrentUserRoles) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Shield className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            ناتوانیت بچیتە ئەم پەڕەیەوە
          </h2>
          <p className="text-muted-foreground text-sm">
            تەنها بەڕێوەبەران دەتوانن ڕۆڵەکانی بەکارهێنەران ببینن و بیگۆڕن
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">بەڕێوەبردنی بەکارهێنەران</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  دروستکردن و دیاریکردنی ڕۆڵ بۆ بەکارهێنەران
                </p>
              </div>
            </div>

            {/* Create User Button */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 sm:h-14 gap-2 text-base rounded-2xl shadow-lg shadow-primary/25">
                  <UserPlus className="h-5 w-5" />
                  دروستکردنی بەکارهێنەر
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-4 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    دروستکردنی بەکارهێنەری نوێ
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      ناو
                    </Label>
                    <Input
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="ناوی بەکارهێنەر"
                      className="h-12 rounded-xl text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      ئیمەیڵ *
                    </Label>
                    <Input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="h-12 rounded-xl text-base"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">وشەی نهێنی *</Label>
                    <Input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="لانیکەم ٦ پیت"
                      className="h-12 rounded-xl text-base"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      ڕۆڵ
                    </Label>
                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                      <SelectTrigger className="h-12 rounded-xl text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allRoles.map((role) => {
                          const Icon = roleIcons[role];
                          return (
                            <SelectItem key={role} value={role} className="py-3">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{roleLabels[role]}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    className="w-full h-12 rounded-xl text-base gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    دروستکردن
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Role Legend - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
          {allRoles.map((role) => {
            const Icon = roleIcons[role];
            return (
              <div
                key={role}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border-2 p-4 transition-all duration-200",
                  role === 'admin' && "border-destructive/30 bg-destructive/5",
                  role === 'storekeeper' && "border-primary/30 bg-primary/5",
                  role === 'viewer' && "border-border bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl",
                  role === 'admin' && "bg-destructive/15 text-destructive",
                  role === 'storekeeper' && "bg-primary/15 text-primary",
                  role === 'viewer' && "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{roleLabels[role]}</p>
                  <p className="text-xs text-muted-foreground">
                    {role === 'admin' && 'هەموو دەسەڵاتەکان'}
                    {role === 'storekeeper' && 'گۆڕینی ستۆک'}
                    {role === 'viewer' && 'تەنها بینین'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Users List - Mobile Cards */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-bold text-foreground">بەکارهێنەران ({usersWithRoles.length})</h2>
          
          {isLoadingUsers ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : usersWithRoles.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">هیچ بەکارهێنەرێک نەدۆزرایەوە</p>
              <p className="text-sm text-muted-foreground/70 mt-1">دەتوانیت بەکارهێنەری نوێ دروست بکەیت</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usersWithRoles.map((user) => (
                <div 
                  key={user.id} 
                  className="rounded-2xl border-2 border-border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
                      {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">
                        {user.full_name || 'بەکارهێنەر'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate" dir="ltr">
                        {user.email || user.id.slice(0, 12) + '...'}
                      </p>
                      
                      {/* Roles */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                            هیچ ڕۆڵێک نییە
                          </span>
                        ) : (
                          user.roles.map((role) => {
                            const Icon = roleIcons[role];
                            return (
                              <Badge
                                key={role}
                                variant="outline"
                                className={cn(
                                  "gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:scale-105",
                                  roleColors[role]
                                )}
                                onClick={() => setDeleteConfirm({ userId: user.id, role })}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {roleLabels[role]}
                                <span className="mr-1 text-[10px] opacity-60">×</span>
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isAssigningRole || isRemovingRole}
                          className="h-10 px-3 rounded-xl shrink-0"
                        >
                          {(isAssigningRole || isRemovingRole) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span className="hidden sm:inline ml-2">زیادکردن</span>
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        {allRoles
                          .filter((role) => !user.roles.includes(role))
                          .map((role) => {
                            const Icon = roleIcons[role];
                            return (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => assignRole({ userId: user.id, role })}
                                className="gap-3 py-3 rounded-lg cursor-pointer"
                              >
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-lg",
                                  role === 'admin' && "bg-destructive/15 text-destructive",
                                  role === 'storekeeper' && "bg-primary/15 text-primary",
                                  role === 'viewer' && "bg-muted text-muted-foreground"
                                )}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{roleLabels[role]}</span>
                              </DropdownMenuItem>
                            );
                          })}
                        {user.roles.length === allRoles.length && (
                          <DropdownMenuItem disabled className="text-center py-3">
                            هەموو ڕۆڵەکان هەیە
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">سڕینەوەی ڕۆڵ</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              ئایا دڵنیایت لە سڕینەوەی ڕۆڵی {deleteConfirm && roleLabels[deleteConfirm.role]}؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  removeRole(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
