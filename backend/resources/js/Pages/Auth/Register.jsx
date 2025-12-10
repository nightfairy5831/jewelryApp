import { useForm, Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import { UserPlus, ShoppingBag, Shield, TrendingUp } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        role: 'buyer',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register.submit'));
    };

    return (
        <>
            <Head title="Registro" />
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
                            <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Cadastre-se como comprador ou vendedor
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={submit}>
                            <FormField
                                id="name"
                                name="name"
                                type="text"
                                label="Nome Completo"
                                autoComplete="name"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Digite seu nome"
                                error={errors.name}
                            />

                            <FormField
                                id="email"
                                name="email"
                                type="email"
                                label="Endereço de Email"
                                autoComplete="email"
                                required
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Digite seu email"
                                error={errors.email}
                            />

                            <FormField
                                id="phone"
                                name="phone"
                                type="tel"
                                label="Telefone (Opcional)"
                                autoComplete="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="(00) 00000-0000"
                                error={errors.phone}
                            />

                            <FormField
                                id="password"
                                name="password"
                                type="password"
                                label="Senha"
                                autoComplete="new-password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                error={errors.password}
                            />

                            <FormField
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                label="Confirmar Senha"
                                autoComplete="new-password"
                                required
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Digite a senha novamente"
                                error={errors.password_confirmation}
                            />

                            <div>
                                <Label htmlFor="role">Tipo de Conta</Label>
                                <select
                                    id="role"
                                    name="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                >
                                    <option value="buyer">Comprador</option>
                                    <option value="seller">Vendedor</option>
                                </select>
                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 text-base"
                            >
                                {!processing && <UserPlus className="w-5 h-5 mr-2" />}
                                {processing ? 'Registrando...' : 'Criar Conta'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Já tem uma conta?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Faça login aqui
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
