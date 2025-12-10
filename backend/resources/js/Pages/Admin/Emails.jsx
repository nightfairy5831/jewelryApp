import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Eye, Save, Code, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function EmailIndex({ emailTemplates }) {
    const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0]);
    const [templateContent, setTemplateContent] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');

    // Send Message states
    const [sendEmail, setSendEmail] = useState('');
    const [sendSubject, setSendSubject] = useState('');
    const [sendMessage, setSendMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Load initial template on mount
    useEffect(() => {
        if (emailTemplates.length > 0 && !templateContent) {
            loadTemplate(emailTemplates[0]);
        }
    }, []);

    // Load template content when template is selected
    const loadTemplate = async (template) => {
        setSelectedTemplate(template);
        setLoading(true);

        try {
            const response = await axios.get(`/admin/emails/${template.id}/template`);
            setTemplateContent(response.data.content);
        } catch (error) {
            toast.error('Erro ao carregar template');
        } finally {
            setLoading(false);
        }
    };

    // Load preview when switching to preview tab
    const handleTabChange = async (value) => {
        setActiveTab(value);

        if (value === 'preview') {
            setLoading(true);
            try {
                const response = await axios.post(`/admin/emails/${selectedTemplate.id}/preview`, {
                    content: templateContent,
                }, {
                    headers: {
                        'Accept': 'text/html',
                    }
                });
                setPreviewHtml(response.data);
            } catch (error) {
                console.error('Preview error:', error);
                toast.error('Erro ao carregar preview: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    // Save template
    const saveTemplate = async () => {
        setLoading(true);

        try {
            await axios.post(`/admin/emails/${selectedTemplate.id}/template`, {
                content: templateContent,
            });
            toast.success('Template salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar template');
        } finally {
            setLoading(false);
        }
    };

    // Send custom email
    const handleSendEmail = async (e) => {
        e.preventDefault();

        if (!sendEmail || !sendSubject || !sendMessage) {
            toast.error('Por favor, preencha todos os campos');
            return;
        }

        setSending(true);

        try {
            const response = await axios.post('/admin/emails/send', {
                to_email: sendEmail,
                subject: sendSubject,
                message: sendMessage,
            });

            if (response.data.success) {
                toast.success('Email enviado com sucesso!');
                setSendEmail('');
                setSendSubject('');
                setSendMessage('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao enviar email');
        } finally {
            setSending(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Gerenciar Emails" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Emails</h1>
                        <p className="mt-2 text-gray-600">
                            Personalize os templates de email enviados automaticamente pelo sistema
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Template List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">Templates de Email</h2>
                                <p className="text-sm text-gray-600 mt-1">Selecione um template para editar</p>
                            </div>
                            <div className="p-4 space-y-2">
                                {emailTemplates.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                            selectedTemplate.id === template.id
                                                ? 'bg-purple-50 border-purple-500'
                                                : 'bg-white border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-2">
                                            <Mail className="w-5 h-5 text-purple-600 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {template.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {template.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Template Editor & Preview */}
                    <div className="lg:col-span-3">
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Assunto: <span className="font-medium">{selectedTemplate.subject}</span>
                                        </p>
                                    </div>
                                    <Button
                                        onClick={saveTemplate}
                                        className="bg-purple-600 hover:bg-purple-700"
                                        disabled={loading || !templateContent}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6">
                                <Tabs value={activeTab} onValueChange={handleTabChange}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="editor">
                                            <Code className="w-4 h-4 mr-2" />
                                            Editor
                                        </TabsTrigger>
                                        <TabsTrigger value="preview">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Preview
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="editor" className="space-y-4">
                                        {/* Variables Info */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm font-medium text-blue-900 mb-2">
                                                Variáveis disponíveis:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.variables.map((variable) => (
                                                    <code
                                                        key={variable}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                                                    >
                                                        {variable}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Code Editor */}
                                        <div className="border rounded-lg overflow-hidden">
                                            <ReactQuill
                                                value={templateContent}
                                                onChange={setTemplateContent}
                                                modules={{
                                                    toolbar: [
                                                        ['bold', 'italic', 'underline', 'strike'],
                                                        [{ 'color': [] }, { 'background': [] }],
                                                        [{ 'header': [1, 2, 3, false] }],
                                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                        [{ 'align': [] }],
                                                        ['link', 'image'],
                                                        ['clean']
                                                    ]
                                                }}
                                                style={{ height: '384px' }}
                                                placeholder="Carregando template..."
                                                readOnly={loading}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="preview" className="space-y-4">
                                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                                            {previewHtml ? (
                                                <iframe
                                                    srcDoc={previewHtml}
                                                    className="w-full h-[600px] border-0"
                                                    title="Email Preview"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-96 text-gray-500">
                                                    Clique em "Preview" para visualizar o email
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Send Message Section */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center space-x-2 mb-3">
                        <Send className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Enviar Mensagem</h2>
                    </div>

                    <form onSubmit={handleSendEmail} className="space-y-3">
                        <input
                            type="text"
                            value={sendSubject}
                            onChange={(e) => setSendSubject(e.target.value)}
                            placeholder="Assunto"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            required
                        />

                        <ReactQuill
                            value={sendMessage}
                            onChange={setSendMessage}
                            modules={{
                                toolbar: [
                                    ['bold', 'italic', 'underline'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link']
                                ]
                            }}
                            style={{ height: '150px', marginBottom: '50px' }}
                            placeholder="Digite sua mensagem..."
                        />

                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={sendEmail}
                                onChange={(e) => setSendEmail(e.target.value)}
                                placeholder="Email do destinatário"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                required
                            />
                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 px-4"
                                disabled={sending || !sendEmail || !sendSubject || !sendMessage}
                            >
                                <Send className="w-3 h-3 mr-1" />
                                <span className="text-xs">{sending ? 'Enviando...' : 'Enviar'}</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
