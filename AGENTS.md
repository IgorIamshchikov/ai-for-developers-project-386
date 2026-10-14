# AGENTS.md

## Правило коммитов

Все коммиты (включая коммиты агента) пишутся по Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `feat!:` для ломающих изменений. На их основе release-please собирает changelog и релизы по semver после мержа в основную ветку `develop`.

## Команды

Локальный Ruby не используется — всё запускается в Docker:

```bash
docker compose up -d                                                        # приложение + PostgreSQL (http://localhost:3000)
docker compose run --rm web bin/ci                                          # все проверки: тесты, линтеры, сканеры
docker compose run --rm -e RAILS_ENV=test web bash -c "bin/rails db:prepare && bin/rspec"  # тесты
docker compose run --rm web bin/rubocop                                     # линтер
```

После правки `Gemfile` обновить `Gemfile.lock` и пересобрать образ:

```bash
docker run --rm -v "$PWD":/app -w /app ruby:3.4 bundle lock --add-platform x86_64-linux
docker compose build
```

## Устройство проекта

- Full-stack Rails 8.1-монолит: фронтенд — серверные вьюхи + Hotwire (Turbo, Stimulus) через importmap; отдельной сборки фронтенда нет.
- PostgreSQL доступен только через docker compose (сервис `db`); подключение задаётся `DATABASE_URL` в `docker-compose.yml` и мержится поверх `config/database.yml`.
- `Dockerfile` — production-образ из коробки плюс стейдж `dev`, который собирает `docker-compose.yml` (ставит все группы гемов, включая development и test).
- Тесты — RSpec (`spec/`), дымовой тест — корневая страница и `/up`. Список шагов локального CI — `config/ci.rb`, запуск — `bin/ci`.
- Линтеры и сканеры: RuboCop (omakase + rubocop-rspec), Brakeman, bundler-audit, importmap audit.
- `.ruby-version` в формате mise (`ruby-3.4.11`): локальный rbenv его не понимает — это ожидаемо, Ruby нужен только в контейнерах.
- CI: `.github/workflows/ci.yml` — тесты и линтеры на каждый push; `release-please.yml` — релизы; `hexlet-check.yml` — служебный workflow Хекслета, не удалять и не менять.
