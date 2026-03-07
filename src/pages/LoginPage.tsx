import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Logo from '../components/common/Logo';
import { login as loginApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error for the field being edited
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.username) newErrors.username = '아이디를 입력해주세요';
        if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const res = await loginApi({ loginId: formData.username, password: formData.password });
            if (res.code === 'SUCCESS' && res.data) {
                localStorage.setItem('accessToken', res.data.accessToken);
                localStorage.setItem('refreshToken', res.data.refreshToken);
                login({
                    userId: res.data.userId,
                    nickname: res.data.nickname,
                    email: res.data.email,
                    role: res.data.role
                });
                navigate('/');
            } else {
                setErrors({ username: res.message || '로그인에 실패했습니다.' });
            }
        } catch (error: any) {
            setErrors({ username: error.response?.data?.message || '로그인 로직 수행 중 오류가 발생했습니다.' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF5FF] via-[#F5F5F4] to-[#FFF7ED] py-10 px-4">
            <div className="w-full max-w-[400px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <Logo className="mb-8" />

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Input
                        label="아이디"
                        id="username"
                        name="username"
                        placeholder="아이디를 입력하세요"
                        value={formData.username}
                        onChange={handleChange}
                        error={errors.username}
                        autoComplete="username"
                    />

                    <Input
                        label="비밀번호"
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호를 입력하세요"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        autoComplete="current-password"
                        innerAction={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors outline-none"
                                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        }
                    />

                    <Button type="submit" fullWidth size="lg" className="mt-4">
                        로그인
                    </Button>
                </form>

                <p className="text-center mt-6 text-sm text-neutral-600">
                    계정이 없으신가요?{' '}
                    <Link to="/signup" className="text-primary-500 font-semibold hover:text-primary-600 transition-colors">
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
