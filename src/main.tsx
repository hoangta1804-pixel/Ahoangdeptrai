import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
// Phông có chân cho tiêu đề và tên sản phẩm (dáng hàng đặc sản thủ công); có bộ chữ tiếng Việt.
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/500-italic.css';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
