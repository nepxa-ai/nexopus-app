"use client";


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Database,
  Network,
  Users,
  Lock,
  Eye,
  TrendingUp,
  Server,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Datos simulados para demostración
const securityMetrics = [
  { name: 'Ene', threats: 12, blocked: 45, allowed: 1250 },
  { name: 'Feb', threats: 8, blocked: 38, allowed: 1180 },
  { name: 'Mar', threats: 15, blocked: 52, allowed: 1320 },
  { name: 'Abr', threats: 6, blocked: 29, allowed: 1280 },
  { name: 'May', threats: 11, blocked: 41, allowed: 1350 },
  { name: 'Jun', threats: 9, blocked: 35, allowed: 1290 }
];

const auditData = [
  { id: 1, timestamp: '2024-01-15 14:30:25', user: 'admin@dalvox.com', action: 'Login exitoso', risk: 'low', ip: '192.168.1.100' },
  { id: 2, timestamp: '2024-01-15 14:25:12', user: 'user@dalvox.com', action: 'Acceso a base de datos', risk: 'medium', ip: '192.168.1.45' },
  { id: 3, timestamp: '2024-01-15 14:20:08', user: 'system', action: 'Backup completado', risk: 'low', ip: 'localhost' },
  { id: 4, timestamp: '2024-01-15 14:15:33', user: 'unknown', action: 'Intento de acceso fallido', risk: 'high', ip: '203.0.113.1' },
  { id: 5, timestamp: '2024-01-15 14:10:15', user: 'api@dalvox.com', action: 'API call - getData', risk: 'low', ip: '192.168.1.200' }
];

const threatDistribution = [
  { name: 'Malware', value: 35, color: '#ef4444' },
  { name: 'Phishing', value: 25, color: '#f97316' },
  { name: 'DDoS', value: 20, color: '#eab308' },
  { name: 'Brute Force', value: 15, color: '#22c55e' },
  { name: 'Otros', value: 5, color: '#8b5cf6' }
];

const connectionStatus = {
  dalvox: { status: 'connected', latency: '45ms', uptime: '99.9%' },
  database: { status: 'connected', latency: '12ms', uptime: '100%' },
  auditSystem: { status: 'connected', latency: '8ms', uptime: '99.7%' }
};

export default function CybersecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshTime(new Date());
      setIsRefreshing(false);
    }, 1500);
  };

  const getRiskBadgeColor = (risk) => {
    switch(risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'connected' ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Dashboard de Ciberseguridad - Nexopus - Casos automáticos Ivanti
            </h1>
            <p className="text-slate-600 mt-1">
              Última actualización: {refreshTime.toLocaleTimeString('es-ES')}
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Estado de Conexiones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dailvox/Voice</CardTitle>
              {getStatusIcon(connectionStatus.dalvox.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Latencia: {connectionStatus.dalvox.latency}</p>
                <p className="text-xs text-slate-600">Uptime: {connectionStatus.dalvox.uptime}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
              {getStatusIcon(connectionStatus.database.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Latencia: {connectionStatus.database.latency}</p>
                <p className="text-xs text-slate-600">Uptime: {connectionStatus.database.uptime}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema de Auditoría</CardTitle>
              {getStatusIcon(connectionStatus.auditSystem.status)}
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Latencia: {connectionStatus.auditSystem.latency}</p>
                <p className="text-xs text-slate-600">Uptime: {connectionStatus.auditSystem.uptime}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connectivity">Conectividad</TabsTrigger>
            <TabsTrigger value="audit">Auditoría</TabsTrigger>        
          </TabsList>


          {/* Tab de Auditoría */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Auditoría</CardTitle>
                <CardDescription>Eventos recientes del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeColor(event.risk)}>
                            {event.risk}
                          </Badge>
                          <span className="font-medium">{event.action}</span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {event.user} - {event.ip} - {event.timestamp}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Conectividad */}
          <TabsContent value="connectivity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Estado de Servidores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Servidor Web</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Servidor BD</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>API Dalvox</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Latencia Alta</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Métricas de Red
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Ancho de Banda</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Latencia Promedio</span>
                        <span>25ms</span>
                      </div>
                      <Progress value={25} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Pérdida de Paquetes</span>
                        <span>0.1%</span>
                      </div>
                      <Progress value={1} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}