import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const emptyPlan = {
    name: '',
    slug: '',
    description: '',
    price: '',
    duration_days: 30,
    scope_type: 'global',
    program_pembelajaran_id: '',
    features: '',
    is_active: true,
};

const emptyTransaction = {
    user_id: '',
    payment_plan_id: '',
    amount: '',
    payment_method: 'manual',
    status: 'pending',
    notes: '',
    proof_of_payment: null,
};

const emptyAccessKey = {
    name: '',
    payment_plan_id: '',
    duration_days: 30,
    max_uses: 1,
    scope_type: 'global',
    program_pembelajaran_id: '',
    expires_at: '',
    notes: '',
};

export default function Pemasukan({
    stats = [],
    transactions = { data: [], links: [] },
    plans = [],
    users = [],
    programs = [],
    accessKeys = [],
    filters = {},
}) {
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showAccessKeyForm, setShowAccessKeyForm] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionNotes, setRejectionNotes] = useState('');
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const planForm = useForm({ ...emptyPlan });
    const transactionForm = useForm({ ...emptyTransaction });
    const accessKeyForm = useForm({ ...emptyAccessKey });
    const filterForm = useForm({
        search: filters.search || '',
        status: filters.status || 'all',
        payment_method: filters.payment_method || 'all',
    });

    const items = transactions?.data || [];

    const submitFilters = (e) => {
        e.preventDefault();
        router.get(route('superadmin.payments'), filterForm.data, { preserveState: true, preserveScroll: true });
    };

    const submitPlan = (e) => {
        e.preventDefault();
        planForm.post(route('superadmin.payments.plans.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowPlanForm(false);
                planForm.reset();
            },
        });
    };

    const submitTransaction = (e) => {
        e.preventDefault();
        transactionForm.post(route('superadmin.payments.transactions.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setShowTransactionForm(false);
                transactionForm.reset();
            },
        });
    };

    const submitAccessKey = (e) => {
        e.preventDefault();
        accessKeyForm.post(route('superadmin.payments.access-keys.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAccessKeyForm(false);
                accessKeyForm.reset();
            },
        });
    };

    const approve = (transactionId) => {
        router.patch(route('superadmin.payments.transactions.approve', transactionId), {
            notes: approvalNotes,
        }, {
            preserveScroll: true,
            onSuccess: () => setApprovalNotes(''),
            onFinish: closeConfirm,
        });
    };

    const reject = () => {
        router.patch(route('superadmin.payments.transactions.reject', rejectTarget.id), {
            notes: rejectionNotes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectTarget(null);
                setRejectionNotes('');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Pemasukan" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Pemasukan</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Monitoring transaksi manual dan Midtrans, approve/reject, access key, dan akses belajar.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => setShowPlanForm(true)} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-black text-gray-700 dark:text-gray-300">
                            Buat Plan
                        </button>
                        <button onClick={() => setShowAccessKeyForm(true)} className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                            Buat Access Key
                        </button>
                        <button onClick={() => setShowTransactionForm(true)} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-red-500/20 hover:bg-red-700">
                            Buat Transaksi
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => <StatCard key={item.title} {...item} />)}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_120px]">
                            <input
                                value={filterForm.data.search}
                                onChange={(e) => filterForm.setData('search', e.target.value)}
                                placeholder="Cari transaksi atau user..."
                                className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white"
                            />
                            <select value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                <option value="all">Semua status</option>
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                            </select>
                            <select value={filterForm.data.payment_method} onChange={(e) => filterForm.setData('payment_method', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                <option value="all">Semua metode</option>
                                <option value="manual">Manual</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="e-wallet">E-Wallet</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="midtrans">Midtrans</option>
                            </select>
                            <button className="rounded-xl bg-gray-900 text-sm font-black text-white dark:bg-white dark:text-gray-900">Filter</button>
                        </form>

                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-[900px] w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Kode</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Plan</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-10 text-center text-sm font-bold text-gray-400">Belum ada transaksi.</td>
                                        </tr>
                                    )}
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">{item.transaction_code}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{item.user_name}</div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.user_email}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-700 dark:text-gray-200">{item.plan_name}</div>
                                                <div className="mt-1 text-xs font-semibold text-gray-400">{item.scope_label}</div>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">{item.amount_formatted}</td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{item.payment_method}</td>
                                            <td className="px-4 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : item.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {item.proof_url && (
                                                        <a href={item.proof_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-black text-gray-700 dark:text-gray-300">
                                                            Bukti
                                                        </a>
                                                    )}
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => openConfirm({
                                                                    variant: 'success',
                                                                    title: 'Approve Transaksi?',
                                                                    message: 'Transaksi akan disetujui dan akses belajar user akan diproses.',
                                                                    confirmLabel: 'Iya, Approve',
                                                                    details: [
                                                                        { label: 'Kode', value: item.transaction_code },
                                                                        { label: 'User', value: item.user_name },
                                                                        { label: 'Nominal', value: item.amount_formatted },
                                                                    ],
                                                                    onConfirm: () => approve(item.id),
                                                                })}
                                                                className="rounded-lg border border-emerald-100 dark:border-emerald-900/30 px-3 py-2 text-xs font-black text-emerald-700 dark:text-emerald-400"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button onClick={() => setRejectTarget(item)} className="rounded-lg border border-red-100 dark:border-red-900/30 px-3 py-2 text-xs font-black text-red-600 dark:text-red-400">
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4">
                            <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} rows={2} placeholder="Catatan approval opsional" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white" />
                        </div>

                        {transactions?.links && transactions.links.length > 3 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {transactions.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-4 py-2 text-sm font-bold ${link.active ? 'bg-red-600 text-white' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Plan Aktif</h2>
                            <div className="mt-4 space-y-3">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{plan.name}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-black ${plan.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                {plan.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-black text-red-600 dark:text-red-400">{plan.price_formatted}</span>
                                            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-400">{plan.duration_days} hari</span>
                                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">{plan.scope_label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Access Key</h2>
                            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Kode akses manual untuk demo, kloter, atau akses kelas dari superadmin.</p>
                            <div className="mt-4 space-y-3">
                                {accessKeys.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm font-bold text-gray-400 dark:border-gray-700">Belum ada access key.</p>
                                )}
                                {accessKeys.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm font-black tracking-widest text-gray-900 dark:text-white">{item.code}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.name || item.plan_name} - {item.duration_days} hari - {item.usage}</p>
                                                <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-300">{item.scope_label}</p>
                                                {item.expires_at && <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">Expired: {item.expires_at}</p>}
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        {item.status === 'active' && (
                                            <button
                                                type="button"
                                                onClick={() => openConfirm({
                                                    variant: 'danger',
                                                    title: 'Revoke Access Key?',
                                                    message: 'Kode tidak bisa dipakai lagi setelah dicabut.',
                                                    confirmLabel: 'Iya, Revoke',
                                                    details: [
                                                        { label: 'Kode', value: item.code },
                                                        { label: 'Nama', value: item.name || item.plan_name || 'Access Key' },
                                                        { label: 'Pemakaian', value: item.usage },
                                                    ],
                                                    onConfirm: () => router.delete(route('superadmin.payments.access-keys.revoke', item.id), {
                                                        preserveScroll: true,
                                                        onFinish: closeConfirm,
                                                    }),
                                                })}
                                                className="mt-3 rounded-lg border border-red-100 px-3 py-2 text-xs font-black text-red-600 dark:border-red-900/40 dark:text-red-400"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {showPlanForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="border-b border-gray-100 dark:border-gray-800 p-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Buat Payment Plan</h3>
                        </div>
                        <form onSubmit={submitPlan} className="space-y-4 p-6">
                            <input value={planForm.data.name} onChange={(e) => planForm.setData('name', e.target.value)} placeholder="Nama plan" className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                            <input value={planForm.data.slug} onChange={(e) => planForm.setData('slug', e.target.value)} placeholder="Slug" className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                            <input value={planForm.data.description} onChange={(e) => planForm.setData('description', e.target.value)} placeholder="Deskripsi" className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={planForm.data.price} onChange={(e) => planForm.setData('price', e.target.value)} placeholder="Harga" className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                                <input type="number" value={planForm.data.duration_days} onChange={(e) => planForm.setData('duration_days', e.target.value)} placeholder="Durasi hari" className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <select
                                    value={planForm.data.scope_type}
                                    onChange={(e) => {
                                        planForm.setData({
                                            ...planForm.data,
                                            scope_type: e.target.value,
                                            program_pembelajaran_id: e.target.value === 'global' ? '' : planForm.data.program_pembelajaran_id,
                                        });
                                    }}
                                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="global">Semua kelas</option>
                                    <option value="program">Per kelas</option>
                                </select>
                                <select
                                    value={planForm.data.program_pembelajaran_id}
                                    onChange={(e) => planForm.setData('program_pembelajaran_id', e.target.value)}
                                    disabled={planForm.data.scope_type !== 'program'}
                                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="">Pilih kelas</option>
                                    {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
                                </select>
                            </div>
                            <textarea value={planForm.data.features} onChange={(e) => planForm.setData('features', e.target.value)} rows={4} placeholder="Satu fitur per baris" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm" />
                            <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-bold">
                                <input type="checkbox" checked={planForm.data.is_active} onChange={(e) => planForm.setData('is_active', e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                Aktif
                            </label>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPlanForm(false)} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold">Batal</button>
                                <button disabled={planForm.processing} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white">{planForm.processing ? 'Menyimpan...' : 'Simpan Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTransactionForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="border-b border-gray-100 dark:border-gray-800 p-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Buat Transaksi Manual</h3>
                        </div>
                        <form onSubmit={submitTransaction} className="space-y-4 p-6">
                            <select value={transactionForm.data.user_id} onChange={(e) => transactionForm.setData('user_id', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm">
                                <option value="">Pilih user</option>
                                {users.map((user) => <option key={user.id} value={user.id}>{user.label}</option>)}
                            </select>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <select
                                    value={transactionForm.data.payment_plan_id}
                                    onChange={(e) => {
                                        const selectedPlan = plans.find((plan) => String(plan.id) === e.target.value);
                                        transactionForm.setData({
                                            ...transactionForm.data,
                                            payment_plan_id: e.target.value,
                                            amount: selectedPlan ? selectedPlan.price : transactionForm.data.amount,
                                        });
                                    }}
                                    className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm"
                                >
                                    <option value="">Pilih plan</option>
                                    {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {plan.scope_label}</option>)}
                                </select>
                                <input type="number" value={transactionForm.data.amount} onChange={(e) => transactionForm.setData('amount', e.target.value)} placeholder="Nominal" className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm" />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <select value={transactionForm.data.payment_method} onChange={(e) => transactionForm.setData('payment_method', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm">
                                    <option value="manual">Manual</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="e-wallet">E-Wallet</option>
                                    <option value="credit_card">Credit Card</option>
                                <option value="midtrans">Midtrans</option>
                                </select>
                                <select value={transactionForm.data.status} onChange={(e) => transactionForm.setData('status', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm">
                                    <option value="pending">Pending</option>
                                    <option value="success">Success</option>
                                    <option value="failed">Failed</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <textarea value={transactionForm.data.notes} onChange={(e) => transactionForm.setData('notes', e.target.value)} rows={3} placeholder="Catatan transaksi" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm" />
                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => transactionForm.setData('proof_of_payment', e.target.files[0] || null)} className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-red-50 file:px-4 file:py-3 file:text-sm file:font-black file:text-red-600" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowTransactionForm(false)} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold">Batal</button>
                                <button disabled={transactionForm.processing} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white">{transactionForm.processing ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAccessKeyForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                        <div className="border-b border-gray-100 p-6 dark:border-gray-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Buat Access Key</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kode dibuat otomatis dan bisa dibagikan ke murid.</p>
                        </div>
                        <form onSubmit={submitAccessKey} className="space-y-4 p-6">
                            <input value={accessKeyForm.data.name} onChange={(e) => accessKeyForm.setData('name', e.target.value)} placeholder="Nama campaign / kelas" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900" />
                            <select value={accessKeyForm.data.payment_plan_id} onChange={(e) => accessKeyForm.setData('payment_plan_id', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900">
                                <option value="">Pakai plan Access Key Premium</option>
                                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} - {plan.scope_label}</option>)}
                            </select>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <select
                                    value={accessKeyForm.data.scope_type}
                                    onChange={(e) => {
                                        accessKeyForm.setData({
                                            ...accessKeyForm.data,
                                            scope_type: e.target.value,
                                            program_pembelajaran_id: e.target.value === 'global' ? '' : accessKeyForm.data.program_pembelajaran_id,
                                        });
                                    }}
                                    disabled={Boolean(accessKeyForm.data.payment_plan_id)}
                                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="global">Semua kelas</option>
                                    <option value="program">Per kelas</option>
                                </select>
                                <select
                                    value={accessKeyForm.data.program_pembelajaran_id}
                                    onChange={(e) => accessKeyForm.setData('program_pembelajaran_id', e.target.value)}
                                    disabled={Boolean(accessKeyForm.data.payment_plan_id) || accessKeyForm.data.scope_type !== 'program'}
                                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <option value="">Pilih kelas</option>
                                    {programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" min="1" max="366" value={accessKeyForm.data.duration_days} onChange={(e) => accessKeyForm.setData('duration_days', e.target.value)} placeholder="Durasi hari" className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900" />
                                <input type="number" min="1" max="500" value={accessKeyForm.data.max_uses} onChange={(e) => accessKeyForm.setData('max_uses', e.target.value)} placeholder="Maks pemakaian" className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900" />
                            </div>
                            <input type="datetime-local" value={accessKeyForm.data.expires_at} onChange={(e) => accessKeyForm.setData('expires_at', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900" />
                            <textarea value={accessKeyForm.data.notes} onChange={(e) => accessKeyForm.setData('notes', e.target.value)} rows={3} placeholder="Catatan internal" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAccessKeyForm(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold dark:border-gray-700">Batal</button>
                                <button disabled={accessKeyForm.processing} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{accessKeyForm.processing ? 'Membuat...' : 'Buat Key'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {rejectTarget && (
                <ConfirmActionDialog
                    show
                    variant="danger"
                    title="Reject Transaksi?"
                    message="Transaksi akan ditolak. Isi alasan agar riwayat audit jelas."
                    confirmLabel="Iya, Reject"
                    details={[
                        { label: 'Kode', value: rejectTarget.transaction_code },
                        { label: 'User', value: rejectTarget.user_name },
                        { label: 'Nominal', value: rejectTarget.amount_formatted },
                    ]}
                    onCancel={() => setRejectTarget(null)}
                    onConfirm={reject}
                >
                    <textarea value={rejectionNotes} onChange={(e) => setRejectionNotes(e.target.value)} rows={4} placeholder="Alasan penolakan" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
                </ConfirmActionDialog>
            )}
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
