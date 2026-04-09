/**
 * Orthodox Expedition — Email Utility
 * Sends emails via Resend API
 * Include this in any page that needs to send emails
 */

const RESEND_API_KEY = 're_VB4icWrk_CrTp2dcATgn5cfwTEoHNhjgH';
const FROM_EMAIL     = 'hello@orthodoxcompanion.com';
const FROM_NAME      = 'The Orthodox Expedition';
const KEVIN_EMAIL    = 'holt.kevin13@gmail.com';

const EmailUtils = {

  async send({ to, subject, html }){
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      if(!res.ok) console.error('Email send error:', data);
      return res.ok;
    } catch(e){
      console.error('Email error:', e);
      return false;
    }
  },

  // ── 1. NEW FAMILY REGISTRATION ──────────────────────────────
  async newFamilyRegistration({ familyName, parentName, parentEmail, parish, childCount, coinRate }){
    return this.send({
      to: KEVIN_EMAIL,
      subject: `✦ New Family Registration — ${familyName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf8ee;border:1px solid #c9922a;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3d1f08,#5c3010);padding:1.5rem;text-align:center;">
            <div style="font-size:1.8rem;color:#f0c96e;margin-bottom:0.25rem;">☩</div>
            <div style="font-family:Georgia,serif;font-size:1.1rem;color:#f0c96e;letter-spacing:0.1em;">The Orthodox Expedition</div>
            <div style="font-size:0.75rem;color:rgba(240,201,110,0.6);letter-spacing:0.2em;text-transform:uppercase;margin-top:0.25rem;">New Family Registration</div>
          </div>
          <div style="padding:1.5rem;">
            <p style="font-size:1rem;color:#3d1f08;margin-bottom:1rem;">A new family has joined the expedition waiting list and needs your approval.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem;">
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);width:40%;">Family Name</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;font-weight:bold;">${familyName}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Parent</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;">${parentName}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Email</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;">${parentEmail}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Parish</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;">${parish || 'Not provided'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Children</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;">${childCount}</td>
              </tr>
              <tr>
                <td style="padding:0.5rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Coin Rate</td>
                <td style="padding:0.5rem 0;font-size:0.9rem;color:#3d1f08;">$${parseFloat(coinRate).toFixed(2)} per coin</td>
              </tr>
            </table>
            <a href="https://holtkevin13-sudo.github.io/Orthodox-Expedition-/admin.html" 
               style="display:block;text-align:center;padding:0.875rem;background:linear-gradient(135deg,#c9922a,#ffd700);border-radius:8px;color:#1a0f00;font-weight:bold;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
              Review & Approve in Admin Panel ✦
            </a>
          </div>
          <div style="padding:0.75rem 1.5rem;text-align:center;font-size:0.72rem;color:rgba(61,31,8,0.35);border-top:1px solid rgba(201,146,42,0.15);">
            The Orthodox Expedition · hello@orthodoxcompanion.com
          </div>
        </div>`,
    });
  },

  // ── 2. FAMILY APPROVED WELCOME ──────────────────────────────
  async familyApproved({ parentName, parentEmail, familyName, appUrl }){
    return this.send({
      to: parentEmail,
      subject: `✦ Welcome to the Orthodox Expedition — ${familyName}!`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf8ee;border:1px solid #c9922a;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3d1f08,#5c3010);padding:1.5rem;text-align:center;">
            <div style="font-size:1.8rem;color:#f0c96e;margin-bottom:0.25rem;">☩</div>
            <div style="font-family:Georgia,serif;font-size:1.1rem;color:#f0c96e;letter-spacing:0.1em;">The Orthodox Expedition</div>
            <div style="font-size:0.75rem;color:rgba(240,201,110,0.6);letter-spacing:0.2em;text-transform:uppercase;margin-top:0.25rem;">Your Family Has Been Approved</div>
          </div>
          <div style="padding:1.5rem;">
            <p style="font-size:1rem;color:#3d1f08;margin-bottom:0.75rem;">Dear ${parentName},</p>
            <p style="font-size:0.95rem;color:rgba(61,31,8,0.75);line-height:1.7;margin-bottom:1rem;">
              The ${familyName} has been approved and your expedition accounts are ready. Your children can now log in and begin their Orthodox journey.
            </p>
            <p style="font-size:0.95rem;color:rgba(61,31,8,0.75);line-height:1.7;margin-bottom:1.25rem;">
              You will receive a separate message with your login credentials. As a parent you can manage coins, approve prizes, mark missions complete, and track your children's progress from your family dashboard.
            </p>
            <a href="${appUrl || 'https://holtkevin13-sudo.github.io/Orthodox-Expedition-/'}"
               style="display:block;text-align:center;padding:0.875rem;background:linear-gradient(135deg,#c9922a,#ffd700);border-radius:8px;color:#1a0f00;font-weight:bold;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
              Begin the Expedition ✦
            </a>
          </div>
          <div style="padding:0.75rem 1.5rem;text-align:center;font-size:0.72rem;color:rgba(61,31,8,0.35);border-top:1px solid rgba(201,146,42,0.15);">
            The Orthodox Expedition · hello@orthodoxcompanion.com
          </div>
        </div>`,
    });
  },

  // ── 3. PRIZE REDEEMED ───────────────────────────────────────
  async prizeRedeemed({ parentEmail, childName, prizeName, prizeEmoji, coinsSpent, coinRate, remainingCoins }){
    const dollarValue = (coinsSpent * parseFloat(coinRate||0.02)).toFixed(2);
    const remaining   = (remainingCoins * parseFloat(coinRate||0.02)).toFixed(2);
    return this.send({
      to: parentEmail,
      subject: `${prizeEmoji||'🎁'} ${childName} redeemed a prize — ${prizeName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf8ee;border:1px solid #c9922a;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3d1f08,#5c3010);padding:1.5rem;text-align:center;">
            <div style="font-size:1.8rem;color:#f0c96e;margin-bottom:0.25rem;">☩</div>
            <div style="font-family:Georgia,serif;font-size:1.1rem;color:#f0c96e;letter-spacing:0.1em;">The Orthodox Expedition</div>
            <div style="font-size:0.75rem;color:rgba(240,201,110,0.6);letter-spacing:0.2em;text-transform:uppercase;margin-top:0.25rem;">Prize Redemption Request</div>
          </div>
          <div style="padding:1.5rem;">
            <p style="font-size:1rem;color:#3d1f08;margin-bottom:1rem;"><strong>${childName}</strong> has requested a prize from the Bazaar and is waiting for your approval.</p>
            <div style="background:rgba(201,146,42,0.08);border:1px solid rgba(201,146,42,0.25);border-radius:10px;padding:1rem;text-align:center;margin-bottom:1.25rem;">
              <div style="font-size:2.5rem;margin-bottom:0.25rem;">${prizeEmoji||'🎁'}</div>
              <div style="font-size:1.1rem;font-weight:bold;color:#3d1f08;">${prizeName}</div>
              <div style="font-size:0.85rem;color:rgba(61,31,8,0.55);margin-top:0.25rem;">${coinsSpent.toLocaleString()} coins · $${dollarValue} value</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem;">
              <tr style="border-bottom:1px solid rgba(201,146,42,0.15);">
                <td style="padding:0.4rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Coins spent</td>
                <td style="padding:0.4rem 0;font-size:0.85rem;color:#3d1f08;text-align:right;">${coinsSpent.toLocaleString()} coins</td>
              </tr>
              <tr>
                <td style="padding:0.4rem 0;font-size:0.8rem;color:rgba(61,31,8,0.5);">Remaining balance</td>
                <td style="padding:0.4rem 0;font-size:0.85rem;color:#3d1f08;text-align:right;">${remainingCoins.toLocaleString()} coins · $${remaining}</td>
              </tr>
            </table>
            <a href="https://holtkevin13-sudo.github.io/Orthodox-Expedition-/parent.html"
               style="display:block;text-align:center;padding:0.875rem;background:linear-gradient(135deg,#c9922a,#ffd700);border-radius:8px;color:#1a0f00;font-weight:bold;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
              Approve in Parent Dashboard ✦
            </a>
          </div>
          <div style="padding:0.75rem 1.5rem;text-align:center;font-size:0.72rem;color:rgba(61,31,8,0.35);border-top:1px solid rgba(201,146,42,0.15);">
            The Orthodox Expedition · hello@orthodoxcompanion.com
          </div>
        </div>`,
    });
  },

  // ── 4. WEEKLY SUMMARY ───────────────────────────────────────
  async weeklySummary({ parentEmail, parentName, children }){
    const childRows = children.map(c=>`
      <tr style="border-bottom:1px solid rgba(201,146,42,0.1);">
        <td style="padding:0.625rem 0;font-size:0.9rem;color:#3d1f08;font-weight:bold;">${c.name}</td>
        <td style="padding:0.625rem 0;font-size:0.85rem;color:rgba(61,31,8,0.7);text-align:center;">${c.coinsEarned}</td>
        <td style="padding:0.625rem 0;font-size:0.85rem;color:rgba(61,31,8,0.7);text-align:center;">${c.sessionsComplete}</td>
        <td style="padding:0.625rem 0;font-size:0.85rem;color:rgba(61,31,8,0.7);text-align:center;">${c.missionsComplete}</td>
        <td style="padding:0.625rem 0;font-size:0.85rem;color:rgba(61,31,8,0.7);text-align:right;">${c.totalCoins.toLocaleString()}</td>
      </tr>`).join('');

    return this.send({
      to: parentEmail,
      subject: `☩ Weekly Expedition Summary — ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'})}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf8ee;border:1px solid #c9922a;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#3d1f08,#5c3010);padding:1.5rem;text-align:center;">
            <div style="font-size:1.8rem;color:#f0c96e;margin-bottom:0.25rem;">☩</div>
            <div style="font-family:Georgia,serif;font-size:1.1rem;color:#f0c96e;letter-spacing:0.1em;">The Orthodox Expedition</div>
            <div style="font-size:0.75rem;color:rgba(240,201,110,0.6);letter-spacing:0.2em;text-transform:uppercase;margin-top:0.25rem;">Weekly Summary</div>
          </div>
          <div style="padding:1.5rem;">
            <p style="font-size:1rem;color:#3d1f08;margin-bottom:1rem;">Dear ${parentName},</p>
            <p style="font-size:0.9rem;color:rgba(61,31,8,0.65);line-height:1.6;margin-bottom:1.25rem;">Here is your family's expedition progress for the week ending ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.25rem;">
              <thead>
                <tr style="border-bottom:2px solid rgba(201,146,42,0.25);">
                  <th style="padding:0.5rem 0;font-size:0.75rem;color:rgba(61,31,8,0.5);text-align:left;font-weight:normal;text-transform:uppercase;letter-spacing:0.1em;">Explorer</th>
                  <th style="padding:0.5rem 0;font-size:0.75rem;color:rgba(61,31,8,0.5);text-align:center;font-weight:normal;text-transform:uppercase;letter-spacing:0.1em;">Coins</th>
                  <th style="padding:0.5rem 0;font-size:0.75rem;color:rgba(61,31,8,0.5);text-align:center;font-weight:normal;text-transform:uppercase;letter-spacing:0.1em;">Sessions</th>
                  <th style="padding:0.5rem 0;font-size:0.75rem;color:rgba(61,31,8,0.5);text-align:center;font-weight:normal;text-transform:uppercase;letter-spacing:0.1em;">Missions</th>
                  <th style="padding:0.5rem 0;font-size:0.75rem;color:rgba(61,31,8,0.5);text-align:right;font-weight:normal;text-transform:uppercase;letter-spacing:0.1em;">Balance</th>
                </tr>
              </thead>
              <tbody>${childRows}</tbody>
            </table>
            <a href="https://holtkevin13-sudo.github.io/Orthodox-Expedition-/parent.html"
               style="display:block;text-align:center;padding:0.875rem;background:linear-gradient(135deg,#c9922a,#ffd700);border-radius:8px;color:#1a0f00;font-weight:bold;text-decoration:none;font-size:0.9rem;letter-spacing:0.05em;">
              View Full Dashboard ✦
            </a>
          </div>
          <div style="padding:0.75rem 1.5rem;text-align:center;font-size:0.72rem;color:rgba(61,31,8,0.35);border-top:1px solid rgba(201,146,42,0.15);">
            The Orthodox Expedition · hello@orthodoxcompanion.com
          </div>
        </div>`,
    });
  },
};
