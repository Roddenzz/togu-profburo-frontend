import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Категории материальной поддержки
const CATEGORIES = [
  { 
    id: 'specially_needy', 
    name: 'Особо нуждающиеся обучающиеся',
    multiplier: '5x',
    description: 'Среднедушевой доход семьи ниже прожиточного минимума, дети-сироты, инвалиды, многодетные семьи'
  },
  { id: 'svo_participants', name: 'Участники СВО', multiplier: '5x', description: 'Участники специальной военной операции' },
  { id: 'with_children', name: 'Воспитывающие детей до 14 лет', multiplier: '5x', description: 'Студенты, воспитывающие детей в возрасте до 14 лет' },
  { id: 'travel_expenses', name: 'Расходы на проезд к месту жительства', multiplier: '5x', description: 'Затраты на проезд от места учебы до места жительства' },
  { id: 'marriage', name: 'Регистрация брака', multiplier: '3x', description: 'В связи с регистрацией брака' },
  { id: 'childbirth', name: 'Рождение ребенка', multiplier: '5x (фикс.)', description: 'В связи с рождением ребенка' },
  { id: 'early_pregnancy', name: 'Ранние сроки беременности', multiplier: '5x', description: 'Беременность на ранних сроках с медицинским подтверждением' },
  { id: 'medical_treatment', name: 'Затраты на лечение и оздоровление', multiplier: '10x', description: 'Медицинское лечение, оздоровление, покупка лекарств' },
  { id: 'emergency', name: 'Чрезвычайные обстоятельства', multiplier: '10x', description: 'Пожар, стихийные бедствия, кража имущества' },
  { id: 'relative_death', name: 'Смерть близкого родственника', multiplier: '5x (фикс.)', description: 'В связи со смертью близкого родственника' },
  { id: 'pensioner_parents', name: 'Родители-пенсионеры', multiplier: '3x', description: 'Родители являются пенсионерами' },
  { id: 'chronic_diseases', name: 'Хронические заболевания', multiplier: '3x', description: 'Диспансерный учет с хроническими заболеваниями' },
  { id: 'single_parent', name: 'Из неполных семей', multiplier: '3x', description: 'Воспитание в неполной семье' },
  { id: 'difficult_situation', name: 'Трудная жизненная ситуация', multiplier: '5x', description: 'Тяжелое материальное положение' }
];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [news, setNews] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState(null);
  const [newApplication, setNewApplication] = useState({
    category: '',
    group: '',
    phone: '',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNews();
    if (token) {
      loadUserData();
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Автоматическое скрытие уведомлений
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const loadNews = async () => {
    try {
      const response = await fetch(`${API_URL}/news`);
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      }
    } catch (err) {
      console.error('Error loading news:', err);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowLogin(false);
        showNotification(`Добро пожаловать, ${data.user.name || data.user.email}!`);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    showNotification('Вы вышли из системы', 'info');
  };

  const [showCabinet, setShowCabinet] = useState(true);

  const viewLanding = () => {
    setShowCabinet(false);
  };

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const loadDashboard = async () => {
    try {
      const [statsRes, appsRes, newsRes] = await Promise.all([
        fetch(`${API_URL}/statistics`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/applications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/news`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'На рассмотрении',
      'approved': 'Одобрено',
      'rejected': 'Отклонено'
    };
    return statusMap[status] || status;
  };

  const getCategoryText = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getFilteredApplications = () => {
    let filtered = applications;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.signature?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryText(app.category).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const createApplication = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Sending application:', newApplication);

    try {
      const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newApplication),
      });

      const data = await response.json();
      console.log('Response:', response.status, data);

      if (response.ok) {
        setShowCreateForm(false);
        setNewApplication({ category: '', group: '', phone: '', notes: '' });
        await loadDashboard();
        showNotification('✅ Заявление успешно подано! Ожидайте рассмотрения комиссией.');
      } else {
        setError(data.error || 'Ошибка создания заявления');
        console.error('Error:', data);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Главная страница (публичная)
  if (!token) {
    return (
      <div className="app landing">
        {/* Система уведомлений */}
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="notification-close">×</button>
          </div>
        )}

        {/* Навигация */}
        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">🎓 ТОГУ Политех</div>
            <button onClick={() => setShowLogin(true)} className="btn-login">
              Личный кабинет
            </button>
          </div>
        </nav>

        {/* Герой секция */}
        <section className="hero">
          <div className="hero-content">
            <h1>Система материальной поддержки студентов</h1>
            <p>ФГБОУ ВО «Тихоокеанский государственный университет»</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">14</span>
                <span className="stat-label">Оснований для поддержки</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">25%</span>
                <span className="stat-label">Стипендиального фонда</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2227₽</span>
                <span className="stat-label">Базовый норматив</span>
              </div>
            </div>
            <div className="hero-actions">
              <button onClick={() => setShowLogin(true)} className="btn-primary">
                Подать заявление
              </button>
              <button onClick={() => document.getElementById('info').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">
                Узнать больше
              </button>
            </div>
          </div>
        </section>

        {/* Информация */}
        <section id="info" className="info-section">
          <h2 className="section-title">О материальной поддержке</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">💰</div>
              <h3>Что это?</h3>
              <p>Материальная поддержка — это часть стипендиального фонда (25% от ГАС и ГСС), предназначенная для помощи нуждающимся обучающимся ТОГУ.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📋</div>
              <h3>Кто может подать?</h3>
              <p>Студенты всех форм обучения, оказавшиеся в трудной жизненной ситуации или имеющие особые обстоятельства.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h3>Как быстро?</h3>
              <p>Заявления рассматриваются в течение 10-14 дней. Решение принимает стипендиальная комиссия.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>14 оснований</h3>
              <p>Мы поддерживаем студентов по 14 различным основаниям с учетом индивидуальных обстоятельств.</p>
            </div>
          </div>
          <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>📊 Статистика за 2025/2026 учебный год</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>847</div>
                <div style={{ color: '#666' }}>Заявлений подано</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>721</div>
                <div style={{ color: '#666' }}>Одобрено</div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>9.2M ₽</div>
                <div style={{ color: '#666' }}>Выплачено</div>
              </div>
            </div>
          </div>
        </section>

        {/* Категории */}
        <section className="categories-section">
          <h2 className="section-title">Основания для получения поддержки</h2>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="category-card" onClick={() => setSelectedCategoryInfo(cat)}>
                <h3>
                  {cat.name}
                  <span className="category-multiplier">{cat.multiplier}</span>
                </h3>
                <p>{cat.description}</p>
                <div className="category-amount">
                  {cat.multiplier.includes('фикс') ? '11 135₽' : `от ${cat.multiplier === '10x' ? '22 270' : cat.multiplier === '5x' ? '11 135' : '6 681'}₽`}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Процесс */}
        <section className="process-section">
          <h2 className="section-title">Как подать заявление?</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Войдите в кабинет</h3>
              <p>Используйте ваш email ТОГУ для входа в личный кабинет</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Выберите основание</h3>
              <p>Выберите подходящую категорию из 14 доступных оснований</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Заполните заявление</h3>
              <p>Укажите причину и сумму, приложите подтверждающие документы</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Ожидайте решения</h3>
              <p>Комиссия рассмотрит заявление в течение 10-14 дней</p>
            </div>
          </div>
        </section>

        {/* Новости */}
        {news.length > 0 && (
          <section className="news-section">
            <h2 className="section-title">Новости</h2>
            <div className="news-grid">
              {news.slice(0, 3).map(item => (
                <div key={item.id} className="news-card">
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <div className="news-date">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Скачать приложение */}
        <section className="download-section">
          <h2 className="section-title">Скачать приложение</h2>
          <p>Подавайте заявления прямо со смартфона!</p>
          <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>📄 Приложение автоматически формирует PDF-документ вашего заявления</p>
          <div className="download-buttons">
            <button className="download-btn" onClick={() => showNotification('Скоро: Версия для Android готовится к релизу!', 'info')}>
              <span className="download-icon">🤖</span>
              <span>Android</span>
            </button>
            <button className="download-btn" onClick={() => showNotification('Скоро: Версия для iOS готовится к релизу!', 'info')}>
              <span className="download-icon">🍎</span>
              <span>iOS</span>
            </button>
            <button className="download-btn" onClick={() => showNotification('Скоро: Версия для Windows готовится к релизу!', 'info')}>
              <span className="download-icon">🪟</span>
              <span>Windows</span>
            </button>
          </div>
        </section>

        {/* Контакты */}
        <section className="contacts-section">
          <h2 className="section-title">Контакты и поддержка</h2>
          <div className="contacts-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
                <strong>Адрес</strong>
                <p style={{ marginTop: '0.5rem' }}>г. Хабаровск<br/>ул. Тихоокеанская, 136</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📞</div>
                <strong>Телефон</strong>
                <p style={{ marginTop: '0.5rem' }}>+7 (4212) 37-50-73<br/>Пн-Пт: 9:00 - 18:00</p>
              </div>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✉️</div>
                <strong>Email</strong>
                <p style={{ marginTop: '0.5rem' }}><a href="mailto:support@pnu.edu.ru" style={{ color: '#667eea', textDecoration: 'none' }}>support@pnu.edu.ru</a></p>
              </div>
            </div>
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', borderLeft: '4px solid #667eea' }}>
              <strong style={{ color: '#667eea' }}>💡 Совет:</strong>
              <p style={{ marginTop: '0.5rem' }}>Перед подачей заявления подготовьте все необходимые документы, подтверждающие ваше основание. Это ускорит процесс рассмотрения!</p>
            </div>
          </div>
        </section>

        {/* Футер */}
        <footer className="footer">
          <p>© 2026 ФГБОУ ВО «ТОГУ»</p>
          <p>Система материальной поддержки студентов</p>
        </footer>

        {/* Модальное окно входа */}
        {showLogin && (
          <div className="modal" onClick={() => setShowLogin(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
              <h2>Вход в личный кабинет</h2>
              <form onSubmit={login}>
                {error && <div className="error">{error}</div>}
                <div className="form-group">
                  <label>Email ТОГУ:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ivanov@togudv.ru"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Пароль:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно категории */}
        {selectedCategoryInfo && (
          <div className="modal" onClick={() => setSelectedCategoryInfo(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedCategoryInfo(null)}>×</button>
              <h2>{selectedCategoryInfo.name}</h2>
              <p><strong>Множитель:</strong> {selectedCategoryInfo.multiplier}</p>
              <p>{selectedCategoryInfo.description}</p>
              <button onClick={() => { setSelectedCategoryInfo(null); setShowLogin(true); }} className="btn-submit">
                Подать заявление
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Если пользователь на главной странице (но авторизован)
  if (!showCabinet) {
    return (
      <div className="app landing">
        {/* Система уведомлений */}
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="notification-close">×</button>
          </div>
        )}

        <nav className="navbar">
          <div className="nav-content">
            <div className="logo">🎓 ТОГУ Политех</div>
            <button onClick={() => setShowCabinet(true)} className="btn-login">
              Личный кабинет
            </button>
          </div>
        </nav>
        <section className="hero">
          <div className="hero-content">
            <h1>Система материальной поддержки студентов</h1>
            <p>ФГБОУ ВО «Тихоокеанский государственный университет»</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">14</span>
                <span className="stat-label">Оснований для поддержки</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">25%</span>
                <span className="stat-label">Стипендиального фонда</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2227₽</span>
                <span className="stat-label">Базовый норматив</span>
              </div>
            </div>
            <div className="hero-actions">
              <button onClick={() => setShowCabinet(true)} className="btn-primary">
                Войти в кабинет
              </button>
              <button onClick={logout} className="btn-secondary">
                Выйти
              </button>
            </div>
          </div>
        </section>
        <section id="info" className="info-section">
          <h2 className="section-title">О материальной поддержке</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">💰</div>
              <h3>Что это?</h3>
              <p>Материальная поддержка — это часть стипендиального фонда (25% от ГАС и ГСС), предназначенная для помощи нуждающимся обучающимся ТОГУ.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📋</div>
              <h3>Кто может подать?</h3>
              <p>Студенты всех форм обучения, оказавшиеся в трудной жизненной ситуации или имеющие особые обстоятельства.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h3>Как быстро?</h3>
              <p>Заявления рассматриваются в течение 10-14 дней. Решение принимает стипендиальная комиссия.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>14 оснований</h3>
              <p>Мы поддерживаем студентов по 14 различным основаниям с учетом индивидуальных обстоятельств.</p>
            </div>
          </div>
        </section>
        <section className="categories-section">
          <h2 className="section-title">Основания для получения поддержки</h2>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="category-card" onClick={() => setSelectedCategoryInfo(cat)}>
                <h3>
                  {cat.name}
                  <span className="category-multiplier">{cat.multiplier}</span>
                </h3>
                <p>{cat.description}</p>
                <div className="category-amount">
                  {cat.multiplier.includes('фикс') ? '11 135₽' : `от ${cat.multiplier === '10x' ? '22 270' : cat.multiplier === '5x' ? '11 135' : '6 681'}₽`}
                </div>
              </div>
            ))}
          </div>
        </section>
        {news.length > 0 && (
          <section className="news-section">
            <h2 className="section-title">Новости</h2>
            <div className="news-grid">
              {news.slice(0, 3).map(item => (
                <div key={item.id} className="news-card">
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <div className="news-date">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        <footer className="footer">
          <p>© 2026 ФГБОУ ВО «ТОГУ»</p>
          <p>Система материальной поддержки студентов</p>
        </footer>
        {selectedCategoryInfo && (
          <div className="modal" onClick={() => setSelectedCategoryInfo(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedCategoryInfo(null)}>×</button>
              <h2>{selectedCategoryInfo.name}</h2>
              <p><strong>Множитель:</strong> {selectedCategoryInfo.multiplier}</p>
              <p>{selectedCategoryInfo.description}</p>
              <button onClick={() => { setSelectedCategoryInfo(null); setShowCabinet(true); }} className="btn-submit">
                Подать заявление
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Интерфейс для сотрудника
  if (user?.is_staff) {
    return (
      <div className="app landing">
        {/* Система уведомлений */}
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="notification-close">×</button>
          </div>
        )}

        <nav className="navbar">
          <div className="nav-content">
            <div className="logo" onClick={viewLanding} style={{ cursor: 'pointer' }}>🎓 ТОГУ Политех</div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: '#333' }}>👔 {user?.name || user?.email}</span>
              <button onClick={logout} className="btn-login">Выйти</button>
            </div>
          </div>
        </nav>

        <section className="hero" style={{ padding: '3rem 2rem' }}>
          <div className="hero-content">
            <h1 style={{ fontSize: '2.5rem' }}>Панель сотрудника</h1>
            {stats && (
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{stats.totalApplications}</span>
                  <span className="stat-label">Всего заявлений</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.pendingApplications}</span>
                  <span className="stat-label">На рассмотрении</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.approvedApplications}</span>
                  <span className="stat-label">Одобрено</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="info-section">
          <h2 className="section-title">Поданные заявления</h2>
          
          {/* Фильтры и поиск */}
          <div style={{ 
            marginBottom: '2rem', 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
          }}>
            <input
              type="text"
              placeholder="🔍 Поиск по студенту, группе, категории..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '0.8rem 1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.8rem 1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Все статусы</option>
              <option value="pending">На рассмотрении</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' }}>
            {getFilteredApplications().length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                {searchQuery || filterStatus !== 'all' ? 'Нет заявлений по выбранным фильтрам' : 'Нет заявлений'}
              </p>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', color: '#666' }}>
                  Найдено заявлений: <strong>{getFilteredApplications().length}</strong> из {applications.length}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Студент</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Группа</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Категория</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Статус</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Сумма</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Дата</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredApplications().map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '1rem' }}>{app.user_name}</td>
                        <td style={{ padding: '1rem' }}>{app.signature || 'н/д'}</td>
                        <td style={{ padding: '1rem' }}>{getCategoryText(app.category)}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className={`status-badge status-${app.status}`}>
                            {getStatusText(app.status)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{app.amount || 'н/д'} ₽</td>
                        <td style={{ padding: '1rem' }}>{new Date(app.created_at).toLocaleDateString('ru-RU')}</td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setSelectedApplication(app)} className="btn-view">
                            Открыть
                          </button>
                          <button onClick={() => showNotification('Функция генерации PDF скоро будет доступна!', 'info')} className="btn-view" style={{ background: '#28a745' }}>
                            📄 PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </section>

        <footer className="footer">
          <p>© 2026 ФГБОУ ВО «ТОГУ»</p>
          <p>Система материальной поддержки студентов</p>
        </footer>

        {selectedApplication && (
          <div className="modal" onClick={() => setSelectedApplication(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedApplication(null)}>×</button>
              <h2>Заявление</h2>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <p><strong>Председателю стипендиальной комиссии ПОЛИТЕХа</strong></p>
                <p><strong>Абузову Александру Викторовичу</strong></p>
                <p>от студента гр. {selectedApplication.signature || 'не указана'}</p>
                <p>{selectedApplication.user_name}</p>
                <p>Номер телефона: {selectedApplication.phone || 'не указан'}</p>
              </div>
              <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Заявление</h3>
              <p>Прошу оказать материальную помощь в связи с тяжелым материальным положением.</p>
              <p><strong>Отношусь к категории:</strong></p>
              <p style={{ marginLeft: '1rem' }}>✓ {getCategoryText(selectedApplication.category)}</p>
              {selectedApplication.description && (
                <>
                  <p><strong>Примечание:</strong></p>
                  <p style={{ marginLeft: '1rem', whiteSpace: 'pre-wrap' }}>{selectedApplication.description}</p>
                </>
              )}
              <p style={{ marginTop: '1rem' }}><strong>Статус:</strong> {getStatusText(selectedApplication.status)}</p>
              <p><strong>Сумма:</strong> {selectedApplication.amount}₽</p>
              <p><strong>Дата подачи:</strong> {new Date(selectedApplication.created_at).toLocaleString('ru-RU')}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '1.5rem' }}>Копии документов, подтверждающие основание, прилагаю.</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => window.alert('Функция скачивания PDF в разработке')} className="btn-submit">
                  📄 Скачать PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Личный кабинет студента
  return (
    <div className="app landing">
      {/* Система уведомлений */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notification-close">×</button>
        </div>
      )}

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo" onClick={viewLanding} style={{ cursor: 'pointer' }}>🎓 ТОГУ Политех</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#333' }}>{user?.name || user?.email}</span>
            <button onClick={logout} className="btn-login">Выйти</button>
          </div>
        </div>
      </nav>

      <section className="hero" style={{ padding: '3rem 2rem' }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem' }}>Личный кабинет</h1>
          {stats && (
            <>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{stats.totalApplications}</span>
                  <span className="stat-label">Всего заявлений</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.pendingApplications}</span>
                  <span className="stat-label">На рассмотрении</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.approvedApplications}</span>
                  <span className="stat-label">Одобрено</span>
                </div>
              </div>
              {stats.approvedApplications > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem 2rem', background: 'rgba(40, 167, 69, 0.2)', borderRadius: '12px', display: 'inline-block' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                    ✅ Вам одобрено поддержки на сумму: <strong>{stats.totalApprovedAmount || 'расчет...'} ₽</strong>
                  </span>
                </div>
              )}
            </>
          )}
          <div className="hero-actions">
            <button onClick={() => setShowCreateForm(true)} className="btn-primary">
              + Подать заявление
            </button>
          </div>
        </div>
      </section>

      <section className="info-section">
        <h2 className="section-title">Мои заявления</h2>
        {applications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '15px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>У вас пока нет заявлений</h3>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1.5rem' }}>
              Подайте первое заявление на материальную поддержку, если вы оказались в трудной жизненной ситуации
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ padding: '1rem 2rem' }}>
              Подать заявление сейчас
            </button>
          </div>
        ) : (
          <>
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1rem', 
              background: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: '10px',
              borderLeft: '4px solid #667eea'
            }}>
              <strong>💡 Статус заявлений:</strong>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span><span className="status-badge status-pending">На рассмотрении</span> - заявление проверяется комиссией</span>
                <span><span className="status-badge status-approved">Одобрено</span> - поддержка будет выплачена</span>
                <span><span className="status-badge status-rejected">Отклонено</span> - требуется уточнение</span>
              </div>
            </div>
            <div className="categories-grid">
              {applications.map(app => (
                <div key={app.id} className="category-card" onClick={() => setSelectedApplication(app)} style={{ cursor: 'pointer' }}>
                  <h3>{getCategoryText(app.category)}</h3>
                  <p><strong>Статус:</strong> <span className={`status-badge status-${app.status}`}>{getStatusText(app.status)}</span></p>
                  <p><strong>Сумма:</strong> {app.amount}₽</p>
                  <div className="category-amount">{new Date(app.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {news.length > 0 && (
        <section className="news-section">
          <h2 className="section-title">Новости</h2>
          <div className="news-grid">
            {news.slice(0, 3).map(item => (
              <div key={item.id} className="news-card">
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                <div className="news-date">{new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>© 2026 ФГБОУ ВО «ТОГУ»</p>
        <p>Система материальной поддержки студентов</p>
      </footer>

      {/* Модальное окно создания заявления */}
      {showCreateForm && (
        <div className="modal" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateForm(false)}>×</button>
            <h2>Новое заявление</h2>
            <form onSubmit={createApplication}>
              {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <p><strong>Председателю стипендиальной комиссии ПОЛИТЕХа</strong></p>
                <p><strong>Абузову Александру Викторовичу</strong></p>
              </div>
              <div className="form-group">
                <label>Группа:</label>
                <input
                  type="text"
                  value={newApplication.group}
                  onChange={(e) => setNewApplication({ ...newApplication, group: e.target.value })}
                  placeholder="ПИН-123"
                  required
                />
              </div>
              <div className="form-group">
                <label>ФИО (полностью):</label>
                <input type="text" value={user?.name || ''} disabled style={{ background: '#f5f5f5' }} />
              </div>
              <div className="form-group">
                <label>Номер телефона:</label>
                <input
                  type="tel"
                  value={newApplication.phone}
                  onChange={(e) => {
                    // Автоформатирование номера
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    if (value.startsWith('8')) value = '7' + value.slice(1);
                    setNewApplication({ ...newApplication, phone: value });
                  }}
                  placeholder="+7 (999) 999-99-99"
                  required
                  style={{ letterSpacing: '0.5px' }}
                />
                {newApplication.phone && newApplication.phone.length < 11 && (
                  <small style={{ color: '#e74c3c', fontSize: '0.85rem' }}>
                    Введите полный номер телефона (11 цифр)
                  </small>
                )}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>Отношусь к категории:</label>
                <select
                  value={newApplication.category}
                  onChange={(e) => setNewApplication({ ...newApplication, category: e.target.value })}
                  required
                  style={{ fontSize: '1rem' }}
                >
                  <option value="">Выберите категорию</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.multiplier})
                    </option>
                  ))}
                </select>
                {newApplication.category && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: 'rgba(102, 126, 234, 0.1)', 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    borderLeft: '3px solid #667eea'
                  }}>
                    <strong>Описание:</strong> {CATEGORIES.find(c => c.id === newApplication.category)?.description}
                    <br/>
                    <strong>Сумма:</strong> {CATEGORIES.find(c => c.id === newApplication.category)?.multiplier.includes('фикс') ? '11 135₽' : 
                      `от ${CATEGORIES.find(c => c.id === newApplication.category)?.multiplier === '10x' ? '22 270' : 
                      CATEGORIES.find(c => c.id === newApplication.category)?.multiplier === '5x' ? '11 135' : '6 681'}₽`}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Примечание:</label>
                <textarea
                  value={newApplication.notes}
                  onChange={(e) => setNewApplication({ ...newApplication, notes: e.target.value })}
                  placeholder="Дополнительная информация..."
                  rows="4"
                />
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Копии документов, подтверждающие основание, прилагаю.</p>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Отправка...' : 'Подать заявление'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно просмотра заявления */}
      {selectedApplication && (
        <div className="modal" onClick={() => setSelectedApplication(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedApplication(null)}>×</button>
            <h2>Заявление</h2>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p><strong>Председателю стипендиальной комиссии ПОЛИТЕХа</strong></p>
              <p><strong>Абузову Александру Викторовичу</strong></p>
              <p>от студента гр. {selectedApplication.signature || 'не указана'}</p>
              <p>{selectedApplication.user_name || user?.name}</p>
              <p>Номер телефона: {selectedApplication.phone || 'не указан'}</p>
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Заявление</h3>
            <p>Прошу оказать материальную помощь в связи с тяжелым материальным положением.</p>
            <p><strong>Отношусь к категории:</strong></p>
            <p style={{ marginLeft: '1rem' }}>✓ {getCategoryText(selectedApplication.category)}</p>
            {selectedApplication.description && (
              <>
                <p><strong>Примечание:</strong></p>
                <p style={{ marginLeft: '1rem', whiteSpace: 'pre-wrap' }}>{selectedApplication.description}</p>
              </>
            )}
            <p style={{ marginTop: '1rem' }}><strong>Статус:</strong> {getStatusText(selectedApplication.status)}</p>
            <p><strong>Сумма:</strong> {selectedApplication.amount}₽</p>
            <p><strong>Дата подачи:</strong> {new Date(selectedApplication.created_at).toLocaleString('ru-RU')}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '1.5rem' }}>Копии документов, подтверждающие основание, прилагаю.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
