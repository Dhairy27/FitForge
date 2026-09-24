(function() {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return;

  async function checkSubscription() {
    try {
      const token = localStorage.getItem('authToken');
      const cacheKey = `sub_cache_${userEmail}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { sub, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 120000) { // 2 min TTL
            updateUpgradeButton(sub);
            return;
          }
        } catch (e) {}
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/user/subscription?email=${encodeURIComponent(userEmail)}`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        const sub = data.subscription;
        sessionStorage.setItem(cacheKey, JSON.stringify({ sub, timestamp: Date.now() }));
        updateUpgradeButton(sub);
      }
    } catch (err) {
      console.error("Error fetching subscription status:", err);
    }
  }

  function updateUpgradeButton(sub) {
    const btn = document.getElementById('sidebar-upgrade-btn');
    if (!btn) return;

    btn.onclick = function() {
      window.location.href = 'upgrade.html';
    };

    if (sub && (sub.status === 'active' || sub.status === 'canceled')) {
      // User is premium pro!
      btn.innerText = 'Pro Member';
      btn.className = 'w-full py-3 bg-gradient-to-r from-white via-secondary to-[#c7c6c6] text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.4)] border-none flex items-center justify-center gap-1.5 duration-300';
      
      const crown = document.createElement('span');
      crown.className = 'material-symbols-outlined text-[18px]';
      crown.innerText = 'workspace_premium';
      btn.prepend(crown);
    } else {
      btn.innerText = 'Upgrade to Pro';
    }
  }

  function setupAdminNav() {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (role === 'admin' || (email && email.toLowerCase() === 'admin@gmail.com')) {
      const navs = document.querySelectorAll('aside nav, #sidebar-nav nav');
      navs.forEach(nav => {
        if (!nav.querySelector('.admin-nav-item')) {
          const adminLink = document.createElement('a');
          adminLink.className = 'admin-nav-item flex items-center gap-4 px-4 py-3 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300 font-bold';
          adminLink.href = 'admin.html';
          adminLink.innerHTML = `
            <span class="material-symbols-outlined text-emerald-400">admin_panel_settings</span>
            <span class="font-body-md text-body-md tracking-tight">Admin Portal</span>
          `;
          nav.insertBefore(adminLink, nav.firstChild);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkSubscription();
      setupAdminNav();
    });
  } else {
    checkSubscription();
    setupAdminNav();
  }
})();
