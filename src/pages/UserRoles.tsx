import { Layout } from "@/components/layout/Layout";
import { useUserRoles, AppRole } from "@/hooks/useUserRoles";
import { Users, Shield, ShieldCheck, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const roleLabels: Record<AppRole, string> = {
  admin: 'بەڕێوەبەر',
  storekeeper: 'کۆگادار',
  viewer: 'بینەر',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  storekeeper: 'bg-primary/10 text-primary border-primary/20',
  viewer: 'bg-muted text-muted-foreground border-border',
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
  } = useUserRoles();

  if (isLoadingCurrentUserRoles) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            ناتوانیت بچیتە ئەم پەڕەیەوە
          </h2>
          <p className="text-muted-foreground">
            تەنها بەڕێوەبەران دەتوانن ڕۆڵەکانی بەکارهێنەران ببینن و بیگۆڕن
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">بەڕێوەبردنی ڕۆڵەکان</h1>
              <p className="mt-1 text-muted-foreground">
                دیاریکردنی ڕۆڵ بۆ بەکارهێنەران
              </p>
            </div>
          </div>
        </div>

        {/* Role Legend */}
        <div className="flex flex-wrap gap-4 animate-slide-up">
          {allRoles.map((role) => {
            const Icon = roleIcons[role];
            return (
              <div
                key={role}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{roleLabels[role]}</span>
                <span className="text-xs text-muted-foreground">
                  {role === 'admin' && '(دەتوانێت هەمووکارێک بکات)'}
                  {role === 'storekeeper' && '(دەتوانێت ستۆک بگۆڕێت)'}
                  {role === 'viewer' && '(تەنها بینین)'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">بەکارهێنەر</TableHead>
                <TableHead className="text-right">ڕۆڵەکان</TableHead>
                <TableHead className="text-right">کردارەکان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : usersWithRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    هیچ بەکارهێنەرێک نەدۆزرایەوە
                  </TableCell>
                </TableRow>
              ) : (
                usersWithRoles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || 'بەکارهێنەر'}</p>
                          <p className="text-sm text-muted-foreground">{user.email || user.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">هیچ ڕۆڵێک نییە</span>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={`${roleColors[role]} cursor-pointer hover:opacity-80`}
                              onClick={() => removeRole({ userId: user.id, role })}
                            >
                              {roleLabels[role]}
                              <span className="mr-1 text-xs">×</span>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAssigningRole || isRemovingRole}
                          >
                            {(isAssigningRole || isRemovingRole) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'زیادکردنی ڕۆڵ'
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {allRoles
                            .filter((role) => !user.roles.includes(role))
                            .map((role) => {
                              const Icon = roleIcons[role];
                              return (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => assignRole({ userId: user.id, role })}
                                  className="gap-2"
                                >
                                  <Icon className="h-4 w-4" />
                                  {roleLabels[role]}
                                </DropdownMenuItem>
                              );
                            })}
                          {user.roles.length === allRoles.length && (
                            <DropdownMenuItem disabled>
                              هەموو ڕۆڵەکان هەیە
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
