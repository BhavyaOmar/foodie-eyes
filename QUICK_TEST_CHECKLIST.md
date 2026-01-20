# Quick Testing Checklist

## 🚀 Setup (One-time)
- [ ] `.env.local` file created with all API keys
- [ ] `npm install` completed
- [ ] `npm run dev` started
- [ ] Application loads at `http://localhost:3000`

---

## 🔍 Critical Query Tests

### Food Queries (Should Work)
- [ ] `pizza` → Shows pizza places
- [ ] `chocolate cake` → Shows bakeries/cafes (multi-word works)
- [ ] `idli dosa sambar` → **South Indian restaurants appear FIRST**
- [ ] `biryani` → Shows biryani places (no wrong cuisine classification)
- [ ] `coffee` → Shows cafes
- [ ] `suggest me some iconic places` → Shows restaurants (conversational works)

### Non-Food Queries (Should Reject)
- [ ] `sweater` → Rejects with "Sorry, I can only help with food..."
- [ ] `iPhone` → Rejects
- [ ] `hospital` → Rejects

### Cuisine Priority Tests
- [ ] `idli dosa sambar` → South Indian places ranked above others
- [ ] `butter chicken` → North Indian places prioritized
- [ ] `noodles manchurian` → Chinese places prioritized

### Place Type Tests
- [ ] `cozy cafe` → Shows **cafes only** (not parks)
- [ ] `quiet restaurant` → Shows restaurants only

### Spelling Correction
- [ ] `Piza` → Corrects to "Pizza" and searches
- [ ] `Biriani` → Corrects to "Biryani" and searches

---

## 📍 Location Tests
- [ ] Location can be set/selected
- [ ] Current location works (if GPS enabled)
- [ ] Location autocomplete works

---

## 🎯 Result Quality Checks
- [ ] Results are relevant to query
- [ ] Ratings and addresses displayed
- [ ] Place cards are clickable
- [ ] Details modal opens with full information
- [ ] No "not available" when results exist

---

## ⚠️ Edge Cases
- [ ] Empty search handled gracefully
- [ ] Invalid location handled
- [ ] Network errors handled (check console)

---

## 🐛 Known Issues to Verify Fixed
- [ ] ✅ "idli dosa sambar" shows South Indian first (not Chinese above)
- [ ] ✅ "chocolate cake" finds results (multi-word works)
- [ ] ✅ "cozy cafe" shows cafes (not parks)
- [ ] ✅ "Biryani" doesn't incorrectly classify as South Indian only

---

## 📝 Quick Notes
- Keep browser DevTools Console open
- Check Network tab for API calls
- Test with different locations
- Verify no console errors
