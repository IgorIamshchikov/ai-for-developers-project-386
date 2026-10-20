# AGENTS.md

## Общие правила

- Не додумывай требования; при неясности спроси, не угадывай.
- Делай минимальный diff: только запрошенное, без speculative features и лишних абстракций.
- Не рефактори соседний код без необходимости; стиль и соглашения бери из редактируемого файла.
- Каждая строка diff должна следовать из запроса; убирай только orphan-код от своих правок.
- Для многошаговых задач составляй краткий план с пунктом verify на каждый шаг.

## Коммиты и ветки

- Коммиты (включая коммиты агента) пишутся по Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `feat!:` для ломающих изменений; описание по-русски, например `feat: добавлен каркас бэкенда`. На их основе release-please собирает changelog и релизы по semver после мержа в основную ветку `develop`.
- Если изменение связано с GitHub issue, указывай номер тикета в коммите: в конце первой строки (`feat: добавлен каркас бэкенда (#NN)`) или в теле (`Closes #NN` / `Refs #NN`).
- Ветки называются по типу коммита: `feat/backend-skeleton`, `test/smoke-test`, `docs/agents`.
- Агент не делает коммитов и пушей сам — только по явному указанию пользователя.
- Изменения сдаются через отдельные ветки и PR в `develop` — по одному PR на задачу, последовательно, не всё сразу.
- Ветка `release-please--branches--develop` на origin — рабочая ветка release-please, её не трогать.

## Устройство проекта

- Бекенд — Rails 8.1 в режиме API: только JSON, без вёрстки, ассетов и JS. База — PostgreSQL 18, порт 3000.
- Фронтенд — отдельное приложение в `frontend/`: Vite + React + TypeScript + shadcn/ui, порт 5173, алиас `@/*` → `frontend/src`. Dev-сервер проксирует `/api` на бекенд (`frontend/vite.config.ts`): `target: http://web:3000`, `changeOrigin: false` — с `true` Rails HostAuthorization блокирует Host `web`.
- Всё запускается в Docker (`docker-compose.yml`): `db` (postgres:18-alpine), `web` (Rails, стейдж `dev` образа), `frontend` (node:26-alpine). Локального Ruby и node_modules на хосте нет; npm-команды — только в контейнере (именованный volume `frontend_node_modules`).
- Тесты бекенда — RSpec (`spec/`); дымовой тест — `GET /up` → 200; каждая спека начинается с `require "rails_helper"`.
- Линтеры: бекенд — RuboCop (omakase + rubocop-rspec), Brakeman, bundler-audit — всё разом через `bin/ci` (список шагов в `config/ci.rb`); фронтенд — Oxlint (`.oxlintrc.json`), проверка типов — `tsc -b` внутри `npm run build`.
- CI: `.github/workflows/ci.yml` — тесты и линтеры на каждый пуш и PR; `release-please.yml` — релизы по semver из истории коммитов.
- Контракт API — TypeSpec (`contract/main.tsp`) → OpenAPI (`contract/openapi.yaml`) → клиентский SDK фронтенда (`frontend/src/api`) и Rails-артефакты (`config/routes/api.rb`, `app/generated/api_params.rb`, генератор — `contract/generate-rails.mjs`). Вся цепочка — одной командой `./script/generate`; эти файлы не правятся руками, только перегенерируются.

## Команды

Локально Ruby и npm не используются — всё запускается в Docker:

- Запуск: `docker compose up -d` (db + web + frontend). Здоровье: `curl localhost:3000/up` → 200, `curl localhost:5173/` → 200.
- Регенерация контракта после правки `contract/main.tsp`: `./script/generate` (TypeSpec → OpenAPI → SDK фронтенда → маршруты и allow-list параметров бекенда).
- Тесты: `docker compose run --rm -e RAILS_ENV=test web bash -c "bin/rails db:prepare && bin/rspec"`.
- Тесты фронтенда: `docker compose run --rm --no-deps frontend npm run test` (Vitest + React Testing Library).
- Локальный CI целиком: `docker compose run --rm web bin/ci` (setup → тесты → rubocop → bundler-audit → brakeman).
- Линт фронтенда: `docker compose run --rm --no-deps frontend npm run lint`; сборка с проверкой типов: `docker compose run --rm --no-deps frontend npm run build`.
- Другие npm-команды фронтенда: `docker compose run --rm --no-deps frontend <команда>` (например `npx shadcn@latest add button`; у `shadcn init` флаги `-b base -p nova --no-monorepo -y`, пресеты нижним регистром).
- Добавление гема: правка `Gemfile` → `docker compose run --rm -e BUNDLE_DEPLOYMENT=0 web bash -c "bundle install && <нужные команды>"` (в образе `BUNDLE_DEPLOYMENT=1` — замороженный lock не даст поставить гем; `Gemfile.lock` обновляется через маунт `.:/rails`) → `docker compose build web` (гемы запекаются в образ при сборке).
- Новые Docker-образы тянуть заранее через `docker pull` — BuildKit-резолв иногда падает с DeadlineExceeded.
- `gh` установлен и авторизован — PR открывает агент по команде пользователя.

## Не коммитить / не трогать

- `config/master.key` — никогда (репозиторий публичный; `/config/master.key` уже в `.gitignore`).
- Служебные файлы Хекслета: `.github/workflows/hexlet-check.yml`, `.github/workflows/README.md`; репозиторий не переименовывать.

## Agent skills

### Issue tracker

Задачи и спеки ведутся в GitHub Issues этого репозитория; все операции — через `gh` CLI. См. `docs/agents/issue-tracker.md`.

### Triage labels

Словарь triage-меток — дефолтные пять ролей: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` и `docs/adr/` в корне репозитория. См. `docs/agents/domain.md`.
