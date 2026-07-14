(function() {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) return;

  async function checkSubscription() {
    try {
      const response = await fetch(`/api/user/subscription?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        const sub = data.subscription;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSubscription);
  } else {
    checkSubscription();
  }
})();
