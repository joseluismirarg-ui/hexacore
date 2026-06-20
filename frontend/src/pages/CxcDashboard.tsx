// =============================================================================
// HEXA CORE SYSTEMS — frontend/src/pages/CxcDashboard.tsx
// Dashboard de Cuentas por Cobrar
// =============================================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Typography, Tag, Button, Modal, Form, InputNumber, Select, Input, message } from 'antd';
import { DollarOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function CxcDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchAging = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/cxc/aging`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Error al cargar reporte de CxC');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const handlePayment = async (values: any) => {
    try {
      const payload = {
        ...values,
        customerId: selectedCustomer.id,
      };
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/cxc/payments`, payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (res.data.success) {
        message.success('Abono registrado correctamente');
        setIsModalVisible(false);
        form.resetFields();
        fetchAging();
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al registrar pago');
    }
  };

  const columns = [
    {
      title: 'Cliente',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string, record: any) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.rfc}</div>
        </div>
      )
    },
    {
      title: 'Límite de Crédito',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      render: (val: string) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    },
    {
      title: 'Deuda Actual',
      dataIndex: 'currentDebt',
      key: 'currentDebt',
      render: (val: string) => <Text strong style={{ color: Number(val) > 0 ? '#faad14' : 'inherit' }}>
        ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
    },
    {
      title: 'Monto Vencido',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      render: (val: string, record: any) => {
        const num = Number(val);
        return (
          <Text strong style={{ color: num > 0 ? '#cf1322' : '#3f8600' }}>
            ${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {num > 0 && <span style={{display:'block', fontSize:'12px'}}>({record.maxDaysOverdue} días de atraso)</span>}
          </Text>
        )
      }
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_: any, record: any) => (
        record.isBlocked ? (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            BLOQUEADO
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            AL CORRIENTE
          </Tag>
        )
      )
    },
    {
      title: 'Acciones',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => {
            setSelectedCustomer(record);
            setIsModalVisible(true);
          }}
        >
          Registrar Pago
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}><DollarOutlined /> Cuentas por Cobrar (CxC)</Title>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`Registrar Pago para ${selectedCustomer?.companyName}`}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Deuda Total: <strong>${Number(selectedCustomer?.currentDebt || 0).toLocaleString()}</strong></Text>
          <br/>
          <Text type="danger">Monto Vencido: <strong>${Number(selectedCustomer?.overdueAmount || 0).toLocaleString()}</strong></Text>
        </div>

        <Form layout="vertical" form={form} onFinish={handlePayment}>
          <Form.Item
            name="amount"
            label="Monto del Abono"
            rules={[{ required: true, message: 'Ingrese el monto' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')}
              min={0.01}
            />
          </Form.Item>
          
          <Form.Item
            name="transactionId"
            label="Aplicar a Nota de Venta (Opcional)"
            tooltip="Si se deja en blanco, el abono se aplica a la deuda global pero no cierra una nota específica."
          >
            <Select allowClear placeholder="Seleccionar Transacción">
              {selectedCustomer?.transactions?.map((tx: any) => (
                <Select.Option key={tx.id} value={tx.id}>
                  {tx.tipo} - {new Date(tx.createdAt).toLocaleDateString()} - ${Number(tx.total).toLocaleString()}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="method"
            label="Forma de Pago"
            rules={[{ required: true, message: 'Seleccione forma de pago' }]}
          >
            <Select>
              <Select.Option value="EFECTIVO">Efectivo (01)</Select.Option>
              <Select.Option value="TRANSFERENCIA">Transferencia (03)</Select.Option>
              <Select.Option value="TARJETA_CREDITO">Tarjeta de Crédito (04)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notas / Referencia">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Registrar Abono
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
