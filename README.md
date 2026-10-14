# Календарь звонков


[![hexlet-check](https://github.com/IgorIamshchikov/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/IgorIamshchikov/ai-for-developers-project-386/actions)
[![CI](https://github.com/IgorIamshchikov/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/IgorIamshchikov/ai-for-developers-project-386/actions/workflows/ci.yml)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- Ruby 3.4, Ruby on Rails 8.1 (фронтенд на Hotwire: Turbo + Stimulus, importmap)
- PostgreSQL 18
- Docker / Docker Compose
- Тесты — RSpec; линтеры и сканеры — RuboCop, Brakeman, bundler-audit
- CI — GitHub Actions, релизы — release-please (Conventional Commits)

## Установка

<!-- Опишите установку: клонирование, зависимости, переменные окружения -->

```bash
git clone https://github.com/IgorIamshchikov/ai-for-developers-project-386.git
cd ai-for-developers-project-386
docker compose up
```

Приложение поднимается вместе с PostgreSQL, собирается dev-образ и открывается на http://localhost:3000. Локальный Ruby не нужен — всё работает в контейнерах.

## Использование

- `docker compose up` — запуск приложения и базы данных
- `docker compose run --rm -e RAILS_ENV=test web bash -c "bin/rails db:prepare && bin/rspec"` — тесты
- `docker compose run --rm web bin/rubocop` — линтер
- `docker compose run --rm web bin/ci` — весь локальный CI разом: тесты, линтеры, сканеры безопасности

<!-- Добавьте примеры запуска и запись asciinema — именно это смотрит работодатель -->

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
