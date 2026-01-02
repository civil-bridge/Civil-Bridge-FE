import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Logo from '../components/common/Logo';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.username) newErrors.username = '아이디를 입력해주세요';
        if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Mock Login API call
        console.log('Login attempt:', formData);
        // On success, navigate to home (which currently redirects to signup, but that's for now)
        navigate('/');
    };

    return (
        <div className="page-container">
            <div className="card">
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
                                className="input-toggle-btn"
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

                <p className="text-center mt-6" style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>
                    계정이 없으신가요?{' '}
                    <Link to="/signup" style={{ color: 'var(--primary-500)', fontWeight: '600' }}>
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
