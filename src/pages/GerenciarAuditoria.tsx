import { useState, useEffect } from "react";
import { auth, supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import {
  Waves,
  ArrowLeft,
  Shield,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  XCircle,
  CheckCircle,
  Info,
  Database,
  ShoppingCart,
  User,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";

interface User {
  id: string;
  email?: string;
}

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  changed_at: string;
  changed_by?: string;
}

interface CarrinhoErro {
  id: string;
  user_id: string;
  produto_id?: string;
  operacao: string;
  erro_code: string;
  erro_message: string;
  erro_details?: any;
  contexto?: any;
  created_at: string;
}

interface TentativaSuspeita {
  id: string;
  user_id: string;
  produto_id?: string;
  tipo_tentativa: string;
  payload_recebido: any;
  dados_validos?: any;
  diferenca_preco?: number;
  diferenca_quantidade?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface SessionLog {
  id: string;
  user_id: string;
  refresh_token_id?: string;
  old_expires_at?: string;
  new_expires_at?: string;
  ip_address?: string;
  user_agent?: string;
  refreshed_at: string;
}

export default function GerenciarAuditoria() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [carrinhoErros, setCarrinhoErros] = useState<CarrinhoErro[]>([]);
  const [tentativasSuspeitas, setTentativasSuspeitas] = useState<
    TentativaSuspeita[]
  >([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("7"); // últimos 7 dias
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadAllLogs();
  }, [dateFilter]);

  const checkUser = async () => {
    try {
      const { user, error } = await auth.getCurrentUser();

      if (error || !user) {
        navigate("/login");
        return;
      }

      const isUserAdmin = await auth.isAdmin(user.id);
      if (!isUserAdmin) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar auditoria.",
          variant: "destructive",
        });
        navigate("/backoffice");
        return;
      }

      setUser(user);
    } catch (error) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadAllLogs = async () => {
    const daysAgo = parseInt(dateFilter);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    await Promise.all([
      loadAuditLogs(startDate),
      loadCarrinhoErros(startDate),
      loadTentativasSuspeitas(startDate),
      loadSessionLogs(startDate),
    ]);
  };

  const loadAuditLogs = async (startDate: Date) => {
    try {
      // ✅ Query corrigida - audit_logs usa 'changed_at'
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("changed_at", startDate.toISOString())
        .order("changed_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Erro ao carregar audit_logs:", error);
        console.log("Tentando query alternativa...");

        // Tentar buscar sem filtro de data para ver se retorna algo
        const { data: allData, error: allError } = await supabase
          .from("audit_logs")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(10);

        if (allError) {
          console.error("Erro na query alternativa:", allError);
          setAuditLogs([]);
        } else {
          console.log(
            `✅ Encontrados ${allData?.length || 0} logs (sem filtro de data)`
          );
          setAuditLogs(allData || []);
        }
      } else {
        console.log(`✅ Encontrados ${data?.length || 0} logs de auditoria`);
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar audit_logs:", error);
      setAuditLogs([]);
    }
  };

  const loadCarrinhoErros = async (startDate: Date) => {
    try {
      const { data, error } = await supabase
        .from("carrinho_erros_log")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Erro ao carregar carrinho_erros_log:", error);

        // Tentar sem filtro
        const { data: allData, error: allError } = await supabase
          .from("carrinho_erros_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (allError) {
          console.error("Erro na query alternativa:", allError);
          setCarrinhoErros([]);
        } else {
          console.log(
            `✅ Encontrados ${allData?.length || 0} erros do carrinho`
          );
          setCarrinhoErros(allData || []);
        }
      } else {
        console.log(`✅ Encontrados ${data?.length || 0} erros do carrinho`);
        setCarrinhoErros(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho_erros_log:", error);
      setCarrinhoErros([]);
    }
  };

  const loadTentativasSuspeitas = async (startDate: Date) => {
    try {
      const { data, error } = await supabase
        .from("carrinho_tentativas_suspeitas")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Erro ao carregar tentativas suspeitas:", error);

        // Tentar sem filtro
        const { data: allData, error: allError } = await supabase
          .from("carrinho_tentativas_suspeitas")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (allError) {
          console.error("Erro na query alternativa:", allError);
          setTentativasSuspeitas([]);
        } else {
          console.log(
            `✅ Encontrados ${allData?.length || 0} tentativas suspeitas`
          );
          setTentativasSuspeitas(allData || []);
        }
      } else {
        console.log(`✅ Encontrados ${data?.length || 0} tentativas suspeitas`);
        setTentativasSuspeitas(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tentativas suspeitas:", error);
      setTentativasSuspeitas([]);
    }
  };

  const loadSessionLogs = async (startDate: Date) => {
    try {
      const { data, error } = await supabase
        .from("session_refresh_log")
        .select("*")
        .gte("refreshed_at", startDate.toISOString())
        .order("refreshed_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("Erro ao carregar session_refresh_log:", error);

        // Tentar sem filtro
        const { data: allData, error: allError } = await supabase
          .from("session_refresh_log")
          .select("*")
          .order("refreshed_at", { ascending: false })
          .limit(10);

        if (allError) {
          console.error("Erro na query alternativa:", allError);
          setSessionLogs([]);
        } else {
          console.log(`✅ Encontrados ${allData?.length || 0} logs de sessão`);
          setSessionLogs(allData || []);
        }
      } else {
        console.log(`✅ Encontrados ${data?.length || 0} logs de sessão`);
        setSessionLogs(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar session_refresh_log:", error);
      setSessionLogs([]);
    }
  };

  const handleViewDetails = (log: any, type: string) => {
    setSelectedLog({ ...log, _type: type });
    setIsDetailDialogOpen(true);
  };

  const handleExportCSV = (type: string) => {
    let data: any[] = [];
    let headers: string[] = [];
    let filename = "";

    switch (type) {
      case "audit":
        data = auditLogs;
        headers = ["ID", "Tabela", "Operação", "Usuário", "Data"];
        filename = `auditoria_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      case "erros":
        data = carrinhoErros;
        headers = [
          "ID",
          "Usuário",
          "Operação",
          "Código Erro",
          "Mensagem",
          "Data",
        ];
        filename = `erros_carrinho_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      case "suspeitas":
        data = tentativasSuspeitas;
        headers = [
          "ID",
          "Usuário",
          "Tipo",
          "Diferença Preço",
          "Diferença Qtd",
          "IP",
          "Data",
        ];
        filename = `tentativas_suspeitas_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      case "sessoes":
        data = sessionLogs;
        headers = ["ID", "Usuário", "IP", "Data"];
        filename = `sessoes_${new Date().toISOString().split("T")[0]}.csv`;
        break;
    }

    if (data.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há registros para exportar.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        Object.values(row)
          .map((cell) => `"${cell}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída!",
      description: `${data.length} registro(s) exportado(s).`,
    });
  };

  const getOperationBadge = (operation: string) => {
    const variants: Record<string, any> = {
      INSERT: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      UPDATE: { color: "bg-blue-100 text-blue-800", icon: Info },
      DELETE: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const variant = variants[operation] || {
      color: "bg-gray-100 text-gray-800",
      icon: Info,
    };
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {operation}
      </Badge>
    );
  };

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCarrinhoErros = carrinhoErros.filter(
    (log) =>
      log.erro_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.erro_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTentativasSuspeitas = tentativasSuspeitas.filter(
    (log) =>
      log.tipo_tentativa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/backoffice")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Auditoria do Sistema
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Logs de Auditoria
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Mudanças no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Erros do Carrinho
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carrinhoErros.length}</div>
              <p className="text-xs text-muted-foreground">Erros registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tentativas Suspeitas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {tentativasSuspeitas.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ataques detectados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessões Renovadas
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Renovações de login
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar em logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24 horas</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={loadAllLogs}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audit">
              <Database className="h-4 w-4 mr-2" />
              Auditoria Geral
            </TabsTrigger>
            <TabsTrigger value="erros">
              <XCircle className="h-4 w-4 mr-2" />
              Erros
            </TabsTrigger>
            <TabsTrigger value="suspeitas">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Suspeitas
            </TabsTrigger>
            <TabsTrigger value="sessoes">
              <Lock className="h-4 w-4 mr-2" />
              Sessões
            </TabsTrigger>
          </TabsList>

          {/* Tab: Auditoria Geral */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Logs de Auditoria</CardTitle>
                    <CardDescription>
                      {filteredAuditLogs.length} registro(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV("audit")}
                    disabled={filteredAuditLogs.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAuditLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Operação</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.table_name}
                          </TableCell>
                          <TableCell>
                            {getOperationBadge(log.operation)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {log.user_id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.changed_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(log, "audit")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum log de auditoria encontrado
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Os logs de auditoria aparecem quando há mudanças nas
                      tabelas do sistema.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Dica:</strong> Experimente fazer alguma
                        alteração em produtos, usuários ou categorias para gerar
                        logs de auditoria.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Erros */}
          <TabsContent value="erros">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Erros do Carrinho</CardTitle>
                    <CardDescription>
                      {filteredCarrinhoErros.length} erro(s) registrado(s)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV("erros")}
                    disabled={filteredCarrinhoErros.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCarrinhoErros.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operação</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCarrinhoErros.map((erro) => (
                        <TableRow key={erro.id}>
                          <TableCell className="font-medium">
                            {erro.operacao}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {erro.erro_code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {erro.erro_message}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(erro.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(erro, "erro")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum erro registrado! 🎉
                    </h3>
                    <p className="text-sm text-gray-500">
                      O sistema de carrinho está funcionando perfeitamente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Suspeitas */}
          <TabsContent value="suspeitas">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tentativas Suspeitas</CardTitle>
                    <CardDescription>
                      {filteredTentativasSuspeitas.length} tentativa(s)
                      detectada(s)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV("suspeitas")}
                    disabled={filteredTentativasSuspeitas.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTentativasSuspeitas.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Dif. Preço</TableHead>
                        <TableHead>Dif. Qtd</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTentativasSuspeitas.map((tentativa) => (
                        <TableRow key={tentativa.id}>
                          <TableCell className="font-medium">
                            <Badge variant="destructive">
                              {tentativa.tipo_tentativa}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tentativa.diferenca_preco
                              ? `R$ ${tentativa.diferenca_preco.toFixed(2)}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {tentativa.diferenca_quantidade || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tentativa.ip_address || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(tentativa.created_at).toLocaleString(
                              "pt-BR"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewDetails(tentativa, "suspeita")
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sistema Seguro 🛡️
                    </h3>
                    <p className="text-sm text-gray-500">
                      Nenhuma tentativa de manipulação detectada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Sessões */}
          <TabsContent value="sessoes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Logs de Sessão</CardTitle>
                    <CardDescription>
                      {sessionLogs.length} renovação(ões) de sessão
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV("sessoes")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.ip_address || "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {log.user_agent || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.refreshed_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(log, "sessao")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sessionLogs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          Nenhuma renovação de sessão registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Log</DialogTitle>
              <DialogDescription>
                Informações completas do registro
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Informações Básicas</h3>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
