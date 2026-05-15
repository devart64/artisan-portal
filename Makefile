.PHONY: install dev stop restart logs build \
        shell-backend shell-frontend shell-db \
        migrate migrate-diff jwt \
        test lint typecheck \
        clean reset

# ── Couleurs ─────────────────────────────────────────────────────────────────
BLUE  := \033[0;34m
GREEN := \033[0;32m
RESET := \033[0m

# ─────────────────────────────────────────────────────────────────────────────
## install : Premier lancement — copie .env, build images, lance tout
# ─────────────────────────────────────────────────────────────────────────────
install:
	@echo "$(BLUE)📦 Artisan Portal — Installation$(RESET)"
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✅ backend/.env créé depuis .env.example$(RESET)"; \
	fi
	@echo "$(BLUE)🐳 Build des images Docker...$(RESET)"
	docker compose build --parallel
	@echo "$(BLUE)🚀 Démarrage des services...$(RESET)"
	docker compose up -d
	@echo "$(BLUE)⏳ Attente de la disponibilité des services...$(RESET)"
	docker compose exec backend bash -c 'until php -r "new PDO(getenv(\"DATABASE_URL\"));" 2>/dev/null; do sleep 1; done' 2>/dev/null || true
	@echo "$(GREEN)✅ Installation terminée !$(RESET)"
	@echo ""
	@echo "  🌐 Frontend  → http://localhost:3000"
	@echo "  🔌 API       → http://localhost:8000"
	@echo "  📧 Emails    → http://localhost:8025"
	@echo ""
	@echo "Commandes utiles :"
	@echo "  make dev      — afficher les logs en direct"
	@echo "  make stop     — arrêter les conteneurs"
	@echo "  make migrate  — jouer les migrations"

# ─────────────────────────────────────────────────────────────────────────────
## dev : Lance et affiche les logs (Ctrl+C pour quitter)
# ─────────────────────────────────────────────────────────────────────────────
dev:
	docker compose up

# ─────────────────────────────────────────────────────────────────────────────
## stop : Arrête les conteneurs
# ─────────────────────────────────────────────────────────────────────────────
stop:
	docker compose down

# ─────────────────────────────────────────────────────────────────────────────
## restart : Redémarre tous les services
# ─────────────────────────────────────────────────────────────────────────────
restart:
	docker compose restart

# ─────────────────────────────────────────────────────────────────────────────
## logs : Suit les logs en temps réel
# ─────────────────────────────────────────────────────────────────────────────
logs:
	docker compose logs -f

## logs-backend  : Logs du backend uniquement
logs-backend:
	docker compose logs -f backend nginx

## logs-frontend : Logs du frontend uniquement
logs-frontend:
	docker compose logs -f frontend

# ─────────────────────────────────────────────────────────────────────────────
## build : Reconstruit les images (après changement de Dockerfile)
# ─────────────────────────────────────────────────────────────────────────────
build:
	docker compose build --parallel

# ─────────────────────────────────────────────────────────────────────────────
## Shells
# ─────────────────────────────────────────────────────────────────────────────
## shell-backend  : Ouvre un shell dans le conteneur backend
shell-backend:
	docker compose exec backend bash

## shell-frontend : Ouvre un shell dans le conteneur frontend
shell-frontend:
	docker compose exec frontend sh

## shell-db       : Ouvre psql dans le conteneur postgres
shell-db:
	docker compose exec postgres psql -U artisan artisan_portal

# ─────────────────────────────────────────────────────────────────────────────
## Doctrine
# ─────────────────────────────────────────────────────────────────────────────
## migrate      : Joue les migrations en attente
migrate:
	docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction

## migrate-diff : Génère une nouvelle migration depuis les entités
migrate-diff:
	docker compose exec backend php bin/console doctrine:migrations:diff

## migrate-status : Affiche l'état des migrations
migrate-status:
	docker compose exec backend php bin/console doctrine:migrations:status

# ─────────────────────────────────────────────────────────────────────────────
## jwt : Régénère les clés JWT
# ─────────────────────────────────────────────────────────────────────────────
jwt:
	docker compose exec backend php bin/console lexik:jwt:generate-keypair --overwrite

# ─────────────────────────────────────────────────────────────────────────────
## Tests & qualité
# ─────────────────────────────────────────────────────────────────────────────
## test         : Lance les tests PHPUnit
test:
	docker compose exec backend php bin/phpunit --testdox

## lint         : Lint frontend (ESLint)
lint:
	docker compose exec frontend pnpm lint

## typecheck    : Vérifie les types TypeScript
typecheck:
	docker compose exec frontend pnpm typecheck

# ─────────────────────────────────────────────────────────────────────────────
## Nettoyage
# ─────────────────────────────────────────────────────────────────────────────
## clean : Supprime les conteneurs et volumes anonymes (garde les données)
clean:
	docker compose down --remove-orphans

## reset : ⚠️  SUPPRIME TOUT (conteneurs + volumes + données BDD)
reset:
	@echo "$(BLUE)⚠️  Suppression de tous les volumes (données perdues)...$(RESET)"
	docker compose down -v --remove-orphans
	@echo "$(GREEN)✅ Reset terminé. Relancez avec : make install$(RESET)"
