import {useState,type FormEvent} from 'react';
import {ArrowRight,LogOut,Phone,ShieldCheck} from 'lucide-react';
import {api} from '../store/backend';
import {useStore} from '../store/AppDataContext';
import {Field,Input,PrimaryButton} from '../components/form';
import {isValidPhone,normalizePhone,PHONE_RULE} from '../domain/phone';
import {useUi} from './UiContext';

/**
 * Tài khoản khách đăng nhập bằng Google (hoặc Supabase) chưa có số điện thoại:
 * bắt buộc nhập SĐT trước khi dùng cửa hàng (để giao hàng, liên hệ đơn).
 */
export function GooglePhoneGate(){
  const {user,logout,showToast}=useUi(),{syncNow}=useStore();
  const [phone,setPhone]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(busy)return;setError('');
    const normalized=normalizePhone(phone);
    if(!isValidPhone(normalized)){setError(`Số điện thoại không hợp lệ. ${PHONE_RULE}`);return;}
    setBusy(true);
    try{await api('/api/v1/me/phone/first',{phone:normalized});syncNow();showToast('Đã lưu số điện thoại. Chào mừng bạn!');}
    catch(err){setError(err instanceof Error?err.message:'Không lưu được số điện thoại.');}
    finally{setBusy(false);}
  };
  return <div className="auth-page"><div className="phone-gate">
    <span className="phone-gate-icon" aria-hidden="true"><Phone size={26}/></span>
    <p className="auth-eyebrow">BƯỚC CUỐI CÙNG</p>
    <h2>Thêm số điện thoại</h2>
    <p className="auth-description">Xin chào <strong>{user?.name}</strong>. Vui lòng nhập số điện thoại để hợp tác xã và đơn vị giao hàng liên hệ khi giao đơn cho bạn.</p>
    <form onSubmit={submit} className="auth-form" aria-label="Nhập số điện thoại cho tài khoản Google">
      <Field label="Số điện thoại" hint={PHONE_RULE}><Input required autoFocus type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0900 000 000"/></Field>
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <PrimaryButton type="submit" disabled={busy} className="w-full">{busy?'Đang lưu…':'Lưu và tiếp tục'} <ArrowRight size={16} className="inline ml-2"/></PrimaryButton>
    </form>
    <p className="phone-gate-note"><ShieldCheck size={15}/> Số điện thoại chỉ dùng cho giao nhận và hỗ trợ đơn hàng.</p>
    <button type="button" className="phone-gate-logout" onClick={()=>{void logout();}}><LogOut size={15}/> Dùng tài khoản khác</button>
  </div></div>;
}
