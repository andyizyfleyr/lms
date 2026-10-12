#!/usr/bin/env bash
# ============================================================
#  Publie ce dossier sur GitHub (dépôt déjà prêt : 1 commit).
#
#  Utilisation :
#    ./publier-sur-github.sh            → pousse vers https://github.com/andyizyfleyr/lms.git
#    ./publier-sur-github.sh ssh        → pousse via git@github.com:andyizyfleyr/lms.git
#    ./publier-sur-github.sh --etat     → affiche l'état, n'envoie rien
#
#  Le script est sans danger : il ne supprime rien, ne réécrit pas l'historique,
#  et propose une mise à jour (git pull --rebase) si le dépôt distant a changé.
# ============================================================
set -euo pipefail

DEPOT_HTTPS="https://github.com/andyizyfleyr/lms.git"
DEPOT_SSH="git@github.com:andyizyfleyr/lms.git"
BRANCHE="main"

cd "$(dirname "$0")"

MODE="${1:-https}"
JUSTE_ETAT=0
case "$MODE" in
  --etat|--status) JUSTE_ETAT=1; DEPOT="$DEPOT_HTTPS" ;;
  ssh|SSH|git@*)   DEPOT="$DEPOT_SSH" ;;
  http*|*)         DEPOT="$DEPOT_HTTPS" ;;
esac

echo "▸ Dossier : $(pwd)"

# 1. Dépôt local (le paquet livré en contient déjà un ; on le recrée si besoin)
if [ ! -d .git ]; then
  echo "▸ Pas de dépôt Git ici → initialisation"
  git init -q -b "$BRANCHE"
  git config user.name  "andyizyfleyr"
  git config user.email "andyizyfleur@gmail.com"
  git add -A
  git commit -q -m "CosmétiLab — application LMS mobile (fichier unique) + API Next.js/Neon"
fi

# 2. Identité de commit (nécessaire si rien n'est configuré sur la machine)
if [ -z "$(git config user.email || true)" ]; then
  git config user.name  "andyizyfleyr"
  git config user.email "andyizyfleur@gmail.com"
  echo "ℹ️  Aucune identité Git sur cette machine : un auteur par défaut a été utilisé."
  echo "   Pour signer à ton nom : git commit --amend --author=\"Ton Nom <ton@email>\""
fi

# 3. Dépôt distant
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$DEPOT"
else
  git remote add origin "$DEPOT"
fi
echo "▸ Dépôt distant : $(git remote get-url origin)"
echo "▸ Branche : $BRANCHE  ·  commit : $(git log --oneline -1)"

# 4. État local
if [ -n "$(git status --porcelain)" ]; then
  echo "▸ Modifications non committées détectées → commit automatique"
  git add -A
  git commit -q -m "Mise à jour CosmétiLab ($(date '+%Y-%m-%d %H:%M'))"
fi

if [ "$JUSTE_ETAT" = "1" ]; then
  echo "▸ Fichiers suivis : $(git ls-files | wc -l)"
  echo "▸ Contenu du dépôt distant :"
  git ls-remote --heads origin || true
  echo "▸ (--etat) Rien n'a été envoyé."
  exit 0
fi

# 5. Si le dépôt distant a déjà des commits, on se met à jour avant de pousser
if [ -n "$(git ls-remote --heads origin 2>/dev/null || true)" ]; then
  echo "▸ Le dépôt distant contient déjà des commits → git pull --rebase"
  git pull --rebase origin "$BRANCHE" || {
    echo "❌ Conflit lors de la mise à jour. Résous-le (git status), puis relance ce script."
    exit 1
  }
fi

# 6. Envoi
echo "▸ Envoi vers GitHub…"
git push -u origin "$BRANCHE"

echo
echo "✅ Terminé. Vérifie sur https://github.com/andyizyfleyr/lms"
echo "   Étape suivante : créer les deux projets Vercel (Root Directory = api, puis = web)"
echo "   → voir DEPLOIEMENT-GITHUB-VERCEL.md"
