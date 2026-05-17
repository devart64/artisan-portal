.PHONY: install dev stop restart logs build \
        shell-backend shell-frontend shell-db \
        migrate migrate-diff jwt \
        test lint typecheck \
        clean reset

# ── Couleurs ─────────────────────────────────────────────────────────────────
BLUE  := \033[0;34m
GREEN := \033[0;32m
RED   := \033[0;31m
RESET := \033[0m

# ─────────────────────────────────────────────────────────────────────────────
## install : Premier lancement — copie .env, build images, lance tout
# ─────────────────────────────────────────────────────────────────────────────
install:
	@echo "$(BLUE)📦 Artisan Portal — Installation$(RESET)"
	@docker info >/dev/null 2>&1 || (echo "$(RED)❌ Erreur : Docker n'est pas lancé. Veuillez démarrer Docker Desktop.$(RESET)" && exit 1)
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✅ backend/.env créé depuis .env.example$(RESET)"; \
	fi
	@echo "$(BLUE)🐳 Build et démarrage des services Docker...$(RESET)"
	docker compose up -d --build
	@echo "$(BLUE)⏳ Attente des services (cela peut prendre une minute)...$(RESET)"
	@until docker compose exec backend php bin/console doctrine:query:sql "SELECT 1" >/dev/null 2>&1; do \
		sleep 2; \
	done
	@echo "$(GREEN)✅ Installation terminée !$(RESET)"
	@echo ""
	@echo "  🌐 Frontend  → http://localhost:3001"
	@echo "  🔌 API       → http://localhost:8001"
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
