import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Truck, Plus, MapPin, Trash2, Search, UserPlus } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMarkets } from "@/hooks/useMarkets";
import {
  useDeliveryPersons,
  useAssignedMarkets,
  useAddDeliveryPerson,
  useAssignMarket,
  useUnassignMarket,
  useDeleteDeliveryPerson,
} from "@/hooks/useDeliveryPersons";
import { toast } from "sonner";

export default function DeliveryPersons() {
  const { isAdmin, usersWithRoles } = useUserRoles();
  const { data: deliveryPersons = [], isLoading } = useDeliveryPersons();
  const { data: markets = [] } = useMarkets();
  const addDeliveryPerson = useAddDeliveryPerson();
  const assignMarket = useAssignMarket();
  const unassignMarket = useUnassignMarket();
  const deleteDeliveryPerson = useDeleteDeliveryPerson();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketSearchTerm, setMarketSearchTerm] = useState("");

  const [newPerson, setNewPerson] = useState({
    user_id: "",
    name: "",
    phone: "",
  });
  const [selectedMarketId, setSelectedMarketId] = useState("");

  const { data: assignedMarkets = [] } = useAssignedMarkets(selectedPersonId ?? undefined);

  // Get users who don't have a delivery person profile yet
  const availableUsers = usersWithRoles.filter(
    user => !deliveryPersons.some(dp => dp.user_id === user.id)
  );

  const filteredPersons = deliveryPersons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.phone?.includes(searchTerm)
  );

  const filteredMarkets = markets.filter(market => {
    const isAssigned = assignedMarkets.some(am => am.market_id === market.id);
    if (isAssigned) return false;
    
    const search = marketSearchTerm.toLowerCase().trim();
    if (!search) return true;
    
    const code = String(market.code || "").toLowerCase();
    const name = (market.name || "").toLowerCase();
    const city = (market.city || "").toLowerCase();
    const phone = (market.phone || "").toLowerCase();
    const zone = (market.zone || "").toLowerCase();
    
    return (
      code.includes(search) ||
      name.includes(search) ||
      city.includes(search) ||
      phone.includes(search) ||
      zone.includes(search)
    );
  });

  const handleAddPerson = async () => {
    if (!newPerson.user_id || !newPerson.name) {
      toast.error("تکایە زانیاریەکان پڕبکەوە");
      return;
    }

    addDeliveryPerson.mutate(newPerson, {
      onSuccess: () => {
        setNewPerson({ user_id: "", name: "", phone: "" });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleAssignMarket = () => {
    if (!selectedPersonId || !selectedMarketId) {
      toast.error("تکایە ماڕکێتێک هەڵبژێرە");
      return;
    }

    assignMarket.mutate({
      delivery_person_id: selectedPersonId,
      market_id: selectedMarketId,
    }, {
      onSuccess: () => {
        setSelectedMarketId("");
        setMarketSearchTerm("");
      },
    });
  };

  const handleDeletePerson = () => {
    if (!deletePersonId) return;
    
    deleteDeliveryPerson.mutate(deletePersonId, {
      onSuccess: () => {
        setDeletePersonId(null);
        if (selectedPersonId === deletePersonId) {
          setSelectedPersonId(null);
        }
      },
    });
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">تەنها ئەدمین دەتوانێت ئەم لاپەڕەیە ببینێت</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مەندوبەکان</h1>
              <p className="text-sm text-muted-foreground">
                بەڕێوەبردنی مەندوبەکان و دیاریکردنی ماڕکێتەکان
              </p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                مەندوبی نوێ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>زیادکردنی مەندوب</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>بەکارهێنەر</Label>
                  <Select
                    value={newPerson.user_id}
                    onValueChange={(value) => {
                      const user = usersWithRoles.find(u => u.id === value);
                      setNewPerson({
                        ...newPerson,
                        user_id: value,
                        name: user?.full_name || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="بەکارهێنەرێک هەڵبژێرە" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ناو</Label>
                  <Input
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    placeholder="ناوی مەندوب"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ژمارەی مۆبایل</Label>
                  <Input
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="ژمارەی مۆبایل"
                  />
                </div>
                <Button
                  onClick={handleAddPerson}
                  disabled={addDeliveryPerson.isPending}
                  className="w-full"
                >
                  زیادکردن
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بە ناو یان ژمارە..."
            className="pr-10"
          />
        </div>

        {/* Delivery Persons Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              چاوەڕێ بکە...
            </p>
          ) : filteredPersons.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              هیچ مەندوبێک نییە
            </p>
          ) : (
            filteredPersons.map((person) => (
              <Card
                key={person.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPersonId === person.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPersonId(person.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{person.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{person.phone || "-"}</p>
                      </div>
                    </div>
                    <Badge variant={person.is_active ? "default" : "secondary"}>
                      {person.is_active ? "چالاک" : "ناچالاک"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePersonId(person.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Selected Person's Markets */}
        {selectedPersonId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ماڕکێتەکانی دەستنیشانکراو
                </CardTitle>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      ماڕکێت زیادبکە
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>دەستنیشانکردنی ماڕکێت</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={marketSearchTerm}
                          onChange={(e) => setMarketSearchTerm(e.target.value)}
                          placeholder="گەڕان بە کۆد یان ناو..."
                          className="pr-10"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredMarkets.slice(0, 50).map((market) => (
                          <div
                            key={market.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedMarketId === market.id
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedMarketId(market.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{market.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {market.code} • {market.city || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleAssignMarket}
                        disabled={!selectedMarketId || assignMarket.isPending}
                        className="w-full"
                      >
                        دەستنیشانکردن
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {assignedMarkets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  هیچ ماڕکێتێک دەستنیشان نەکراوە
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {assignedMarkets.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{assignment.market?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.market?.code} • {assignment.market?.city || "-"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unassignMarket.mutate(assignment.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePersonId} onOpenChange={() => setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>دڵنیایت لە سڕینەوە؟</AlertDialogTitle>
            <AlertDialogDescription>
              ئەم کردارە ناگەڕێتەوە. مەندوب و هەموو دەستنیشانکردنەکانی دەسڕدرێنەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-destructive hover:bg-destructive/90"
            >
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
