import { useForm, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LogIn, ShoppingBag, Shield, TrendingUp } from 'lucide-react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login.submit'));
    };

    return (
        <>
            <Head title="Login Admin" />
            <div className="min-h-screen flex">
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    ></div>

                    <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                        <div className="mb-8">
                            <ShoppingBag className="w-16 h-16 mb-4" />
                            <h1 className="text-5xl font-bold mb-4">Fala</h1>
                            <p className="text-xl text-blue-100 mb-8">
                                Sistema de Gestão para E-commerce de Ouro
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Segurança Avançada</h3>
                                    <p className="text-blue-100">Proteção completa dos seus dados e transações</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Precificação Dinâmica</h3>
                                    <p className="text-blue-100">Atualização automática baseada no preço do ouro</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Gestão Completa</h3>
                                    <p className="text-blue-100">Controle total de vendedores, produtos e pedidos</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/20">
                            <p className="text-sm text-blue-100">
                                &copy; 2025 Fala. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                    <div className="max-w-md w-full">
                        <div className="mb-8">
                            <div className="lg:hidden mb-6">
                                <ShoppingBag className="w-12 h-12 text-blue-600 mb-2" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Bem-vindo de volta</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Faça login para acessar o painel administrativo
                            </p>
                        </div>

                        {status && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium text-green-800">{status}</p>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={submit}>
                            <FormField
                                id="email"
                                name="email"
                                type="email"
                                label="Endereço de Email"
                                autoComplete="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Enter your email"
                                error={errors.email}
                            />

                            <FormField
                                id="password"
                                name="password"
                                type="password"
                                label="Senha"
                                autoComplete="current-password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                error={errors.password}
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <Label htmlFor="remember" className="mb-0 cursor-pointer font-normal">
                                        Lembrar de mim
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 text-base"
                            >
                                {!processing && <LogIn className="w-5 h-5 mr-2" />}
                                {processing ? 'Entrando...' : 'Entrar no Painel'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Não tem uma conta?{' '}
                                <a
                                    href={route('register')}
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Registre-se aqui
                                </a>
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-xs text-center text-gray-500">
                                Acesso restrito apenas para administradores autorizados
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
