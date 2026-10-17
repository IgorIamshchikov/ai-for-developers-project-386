# Инструменты генерации артефактов — wayfinder-исследование

Тикет: [#22 «Инструменты генерации артефактов»](https://github.com/IgorIamshchikov/ai-for-developers-project-386/issues/22), карта [#18](https://github.com/IgorIamshchikov/ai-for-developers-project-386/issues/18).
Вопрос: чем собирать цепочку Design First «TypeSpec → OpenAPI → клиентский SDK + серверные артефакты» под стек Rails 8.1 (API) + Vite/React 19/TS + Docker, с учётом правила «Ruby и npm на хосте нет».

Конвенции хранения исследований в репо не было — этот файл открывает `docs/research/`, имя по номеру тикета. Исследование на throwaway-ветке `research/generation-tooling`, которая не мержится; выводы фиксируются в трекере.

## Сводка рекомендации

| Звено цепочки | Инструмент | Версия (окт. 2026) | Статус |
| --- | --- | --- | --- |
| TypeSpec → OpenAPI | `@typespec/compiler` + `@typespec/openapi3` | 1.17.0 | стабильный, Microsoft |
| OpenAPI → TS-клиент | `@hey-api/openapi-ts` (fetch-клиент по умолчанию) | 0.99.0 | стабильный, активно развивается; пиннить точную версию |
| OpenAPI → проверка запросов (Rails) | гем `openapi_first` | 4.2.0 | стабильный, релиз 2026-10-07 |
| Маршруты и «типы» на бекенде | руками (тонкие routes) + контрактные тесты `openapi_first` | — | зрелой генерации нет — см. «Расхождения» |

- TypeSpec-проект — в **`contract/` в корне репозитория** (не внутри `frontend/` и не в дереве Rails): контракт общий для обеих сторон.
- Компиляция — в **отдельном compose-сервисе `contract`** (образ `node:26-alpine`, как и фронтенд): сервис `frontend` маунтит только `./frontend:/app`, корня репо в нём нет; держать tsp-проект где-то ещё и чинить это расширенными маунтами — хуже, чем один сервис для всей генерации.
- Вся цепочка — **одной командой `./script/generate`** → `docker compose run --rm --no-deps contract npm run generate` → npm-скрипт `tsp compile . && openapi-ts`.
- OpenAPI Generator для Rails-стороны **не рекомендуется** (пояснение ниже).

---

## 1. Серверные артефакты для Rails

### 1.1. Что реально умеет OpenAPI Generator

Генераторы для Ruby в OpenAPI Generator v7.26.0 (релиз 2026-10-06, проект жив): `ruby` и `ruby-nextgen` (клиентские SDK), `ruby-on-rails` (сервер), `ruby-sinatra` (сервер) — [docs/generators/ruby-on-rails.md](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/ruby-on-rails.md), [шаблоны](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources).

Генератор `ruby-on-rails` (статус STABLE, тип SERVER, helpTxt: *«Generates a Ruby on Rails (v5) server library»*):

- **Генерирует целое новое Rails-приложение**, а не артефакты в существующее: в [шаблонах](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources/ruby-on-rails-server) — `Gemfile.mustache`, `Rakefile`, `boot.rb`, `application.rb`, `config.ru`, `puma.rb`, `spring.rb`, `secrets.yml`, `Dockerfile`, `public/` (favicon, robots.txt) и т.п. Это скаффолд эпохи Rails 5 (`spring`, `secrets.yml`), который нельзя «влить» в существующее Rails 8.1-приложение.
- **Маршруты**: [`routes.mustache`](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/ruby-on-rails-server/routes.mustache) пишет `config/routes.rb` с хелпером `add_openapi_route`, маппящим пути спеки на `controller#action` — то, что нужно, но только внутри генерируемого приложения.
- **Контроллеры-заготовки**: [`controller.mustache`](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/ruby-on-rails-server/controller.mustache) — стаб-экшены `# Your code here` + заглушка `render json: {"message" => "yes, it worked"}`.
- **Модели**: [`model.mustache`](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/modules/openapi-generator/src/main/resources/ruby-on-rails-server/model.mustache) — классы `ApplicationRecord` c `validates_presence_of` для required-полей и `serialize` для Array/Hash. Это DB-модели, не «типы».
- **Проверки запросов нет вообще**: ни middleware-валидации, ни схем — только стабы.
- Фичи по [официальной таблице](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/ruby-on-rails.md): `oneOf/anyOf/allOf` — ✗, cookie-параметры — ✗, схемы безопасности — ✗.
- Запуск требует Java: npm-обёртка `@openapitools/openapi-generator-cli` поверх JAR, либо официальный Docker-образ — [docs/installation.md](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/installation.md): `docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate -i ... -g ruby-on-rails -o ...`.

**Вывод**: генератор зрелый и живой, но его модель — «спека → новое приложение Rails 5». Для нашего сценария (артефакты в существующее Rails 8.1 API-приложение) он не подходит; тащить Java/Docker-образ ради стабов, которые потом переписываются, не стоит.

### 1.2. TypeSpec-нативные генераторы серверов/клиентов

У TypeSpec появились собственные генераторы напрямую из `.tsp` (в доках — разделы Emitters → Clients/Servers): `@typespec/http-client-js/python/java/csharp` и `@typespec/http-server-js/csharp`. По первоисточнику (исходник дока [clients/introduction.mdx](https://github.com/microsoft/typespec/blob/main/website/src/content/docs/docs/emitters/clients/introduction.mdx)): *«all client emitters are currently in **preview**»*; [http-server-js/project.md](https://github.com/microsoft/typespec/blob/main/website/src/content/docs/docs/emitters/servers/http-server-js/project.md): *«highly experimental»*. **Ruby-эмиттеров нет вовсе**. Поэтому стабильный путь для нашего стека — через OpenAPI: `@typespec/openapi3` (OpenAPI 3.0/3.1) + сторонние потребители спеки.

### 1.3. Альтернативы-гемы (проверены по RubyGems API и README, окт. 2026)

| Гем | Версия / дата | Что делает | Оценка под задачу |
| --- | --- | --- | --- |
| [`openapi_first`](https://github.com/ahx/openapi_first) | 4.2.0, 2026-10-07 | Rack-middleware валидации запросов (4xx + parsed params) и ответов; контрактное тестирование через rack-test c coverage-отчётом; OpenAPI 3.0 и 3.1 | **Рекомендуется**: живой, свежий релиз, ошибки RFC 9457, всё в одном |
| [`committee`](https://github.com/interagent/committee) | 5.6.4, 2026-09-21 | Rack-middleware RequestValidation/ResponseValidation (OpenAPI 2/3), strict-режим | Зрелая альтернатива; для Rails-коэрции нужен хак `params_key: 'action_dispatch.request.request_parameters'`; нет coverage-отчёта; ошибки без RFC 9457 |
| [`openapi_contracts`](https://github.com/mkon/openapi_contracts) (в тикете — «openapi-contract») | 0.17.0 | RSpec-матчер `match_openapi_doc`: ответ запрос-спеки сверяется с OpenAPI; JSON coverage-отчёт | Только тесты, без рантайма; полезен тикету #23, дублирует openapi_first Test |
| [`rswag`](https://rubygems.org/gems/rswag) | 2.17.0 | Генерирует OpenAPI **из** RSpec-тестов | Обратное направление (spec-last), Design First не подходит |

Факты по `openapi_first` (из [README](https://github.com/ahx/openapi_first) и [примеру Rails в репе](https://github.com/ahx/openapi_first/tree/main/examples/rails_app)):

- `OpenapiFirst.register('openapi/openapi.yaml')` глобально; в Rails — инициализатор + `config.middleware.use OpenapiFirst::Middlewares::RequestValidation`.
- Middleware возвращает 4xx на невалидный или **не описанный в спеке** запрос и кладёт в `env[OpenapiFirst::REQUEST]` разобранные по спеке параметры: `parsed_body`, `parsed_query`, `parsed_path_parameters`, `parsed_params`; ошибки — RFC 9457 `application/problem+json`.
- Контрактные тесты: `OpenapiFirst::Test.setup` + `OpenapiFirst::Test::Methods[MyApp]` в `ActionDispatch::IntegrationTest` (`assert_api_conform(status: 200)`), coverage — HTML-отчёт. Пример Rails 7.1 API-приложения: [test_helper.rb](https://github.com/ahx/openapi_first/blob/main/examples/rails_app/test/test_helper.rb). Middleware — уровень Rack, заявлена совместимость «probably all Ruby web frameworks»; Rack 2.2–3.x (Rails 8 — Rack 3, ок).
- Маршрутный DSL `OpenapiFirst::Sinatra` (роуты по `operationId` прямо из спеки) — **только для Sinatra**, для Rails его нет.
- `ResponseValidation` middleware существует, но сам README советует вместо него контрактные тесты.

Выбор `openapi_first` против `committee`: тот же механизм валидации, но свежее поддержка OpenAPI 3.1, ошибки RFC 9457, встроенное контрактное тестирование с coverage (ложится на тикет #23 «Границы тестирования»), и не нужен Rails-хак с `params_key`. `openapi_first` сам [заявлен](https://github.com/ahx/openapi_first) как вдохновлённый committee.

### 1.4. Расхождения с ожиданиями task_2.md (важно)

task_2.md ждёт на бекенде «типы, схемы проверки запросов и заготовки маршрутов». Проверено по первоисточникам:

1. **«Типы» на Rails генерации не подлежат.** Ruby не типизирован, зрелого генератора «OpenAPI → RBS/Sorbet RBI» нет. Реально «типы» на бекенде получают как: валидированные и приведённые к типам спеки параметры (`env[OpenapiFirst::REQUEST].parsed_params`) и контрактные тесты, ловящие расхождения до релиза. Это замена, не эквивалент — фиксируем честно.
2. **«Заготовки маршрутов» в существующее Rails-приложение генерировать нечем.** Единственный Rails-генератор маршрутов из OpenAPI (OpenAPI Generator `ruby-on-rails`) работает только в составе целого нового приложения Rails 5. Рекомендация: тонкий `config/routes.rb` пишется руками один раз (пара строк `scope`/`resources`), а соответствие маршрутов контракту страхуют контрактные тесты и coverage `openapi_first`: расхождение маршрута со спекой — красный тест.
3. Итого Rails получает 2 из 3 артефактов генерацией («проверка запросов» — дважды: рантайм-middleware + тесты; «типы» — рантайм-параметры), третий (маршруты) — руками под страховкой тестов.

## 2. Клиентский SDK: @hey-api/openapi-ts

Факты ([heyapi.dev](https://heyapi.dev/docs/openapi/typescript/get-started), [npm](https://www.npmjs.com/package/@hey-api/openapi-ts)):

- Актуальная версия **0.99.0**, Node >= 22.18, TypeScript peer `>=5.5.3 || >=6.0.0` (наш `typescript ~7.0.2` — подходит), образ `node:26-alpine` — подходит. «Used by Vercel, OpenCode, PayPal».
- Пакет на семвере 0.x, официальная рекомендация — **пиннить точную версию** (`npm install @hey-api/openapi-ts -D -E`).
- Конфиг — `openapi-ts.config.ts` c `defineConfig({ input, output })`; вход — файл/URL любого формата OpenAPI; **папку output трактовать как зависимость и руками не править** (генерация повторяемая).
- По умолчанию генерирует TypeScript-интерфейсы + SDK, HTTP-клиент — Fetch API (можно Axios/Ky/Next/Nuxt и др.).
- **Сгенерированный SDK самодостаточен**: клиент бандлится внутрь output-папки (`client/` и `core/`), отдельный рантайм-пакет `@hey-api/client-fetch` [депрекейтед с v0.73.0](https://www.npmjs.com/package/@hey-api/client-fetch) — «bundled directly inside @hey-api/openapi-ts». То есть **фронтенду не добавляется ни одной рантайм-зависимости**.
- Структура output: `sdk.gen.ts` (типизированные функции, по умолчанию flat/tree-shakeable), `types.gen.ts`, `client.gen.ts` (+ бандлы `client/`, `core/`), `index.ts`.
- Для Vite есть `@hey-api/vite-plugin` (v0.3.2, peer `vite ^5||^6||^7||^8` — наш `vite ^8.3.0` подходит): регенерация прямо в dev-пайплайне. Опционально; минимальный путь — явный npm-скрипт.
- Опциональные плагины: `zod`/`valibot` (валидация на клиенте), `@tanstack/react-query` (когда появятся запросы-кэши) — пока не нужны.

### Интеграция с нашим Vite+React+TS

- Output кладём в **`frontend/src/api`** — под алиасом `@/*` фронтенд импортирует `import { listEventTypes } from '@/api'`; вызовы вида `await listEventTypes({ query: {...} })`, типы — из `types.gen`. `tsc -b` (в `npm run build`) тайпчекает сгенерированный код — расхождение с контрактом ломает сборку фронта, как и задумано в Design First.
- **BaseUrl и прокси**: dev-сервер Vite проксирует `/api` → `http://web:3000` (`frontend/vite.config.ts`). Прокси не переписывает путь, значит Rails видит пути с префиксом `/api`. Простое решение без настроек клиента — **прописать префикс `/api` прямо в путях контракта** (`@route("/api/event-types")` в TypeSpec): тогда клиенту хватает дефолтного baseUrl, Rails-маршруты зеркалят спеку (`scope :api`), и валидатор `openapi_first` сравнивает одинаковые пути без плясок. Альтернатива (если #21 решит пути без префикса) — `runtimeConfigPath` c `baseUrl: '/api'` или `config.path` в openapi_first (обе опции документированы). Итоговый выбор префикса — за тикетами #21/#24.
- Oxlint: сгенерированную папку стоит исключить из линта (`.oxlintrc.json` ignorePatterns для `src/api`) — код не наш, править его нельзя.

## 3. TypeSpec: где проект и как компилируется

Факты ([typespec.io/docs](https://typespec.io/docs), [npm](https://www.npmjs.com/package/@typespec/compiler)):

- Компилятор `@typespec/compiler` 1.17.0 (Node >= 22), эмиттер `@typespec/openapi3` 1.17.0 — библиотека «emitting OpenAPI 3.0 and OpenAPI 3.1». `@hey-api/openapi-ts` TypeSpec напрямую не читает — стабильная цепочка только через OpenAPI.
- Инициализация: `tsp init` (интерактивный шаблон «Generic REST API», выбирает `@typespec/http` + `@typespec/openapi3`), компиляция `tsp compile .` — по умолчанию вывод в `tsp-output/@typespec/openapi3/openapi.yaml`.
- [Опции эмиттера](https://typespec.io/docs/emitters/openapi3/reference/emitter/): `emitter-output-dir` (дефолт `{output-dir}/@typespec/openapi3`), `output-file`, `openapi-versions` (дефолт `["3.0.0"]`). Для нас достаточно дефолтной 3.0.0: openapi_first понимает 3.0 и 3.1, committee — 3.0, heyapi — любую.
- [tspconfig.yaml](https://typespec.io/docs/handbook/configuration/configuration/): `emit` + `options`, переменные `{project-root}`, `{cwd}`; правило «output-dir должен быть абсолютным — используй {project-root}».

### Размещение: `contract/` в корне

- Контракт — общий источник правды для фронта и бека, поэтому не внутри `frontend/` (бекенду он нужен не меньше) и не в дереве Rails (`app/`). Каталог `contract/` в корне монорепо: Rails-контейнер уже маунтит весь корень (`.:/rails`) → спека видна как `contract/openapi.yaml`; туда же пишет компилятор.
- `contract/` — самостоятельный npm-пакет: `package.json` c devDeps (`@typespec/compiler`, `@typespec/openapi3`, `@hey-api/openapi-ts` — вся инструментальная обвязка цепочки в одном месте, фронтенду зависимостей не добавляем), `tspconfig.yaml`, `main.tsp`, `openapi-ts.config.ts`.
- Сгенерированные артефакты (спека и SDK) коммитим: диффы ревьюсятся, а CI может проверить идемпотентность (пергенерация + `git diff --exit-code`) — это и есть критерий «генерация повторяется одной командой».

## 4. Docker-контейнер и единая команда

Почему отдельный compose-сервис, а не `frontend`:

- Сервис `frontend` маунтит только `./frontend:/app` — корня и `contract/` в нём нет; пришлось бы расширять его маунты и смешивать контрактную обвязку с зависимостями приложения.
- Генерация — одноразовый запуск, не long-running сервис: `docker compose run --rm` по образцу уже принятых в AGENTS.md команд.
- Образ `node:26-alpine` — тот же, что у `frontend`; версии Node покрывают требования обоих инструментов (`tsp` ≥ 22, `openapi-ts` ≥ 22.18).

Сервис в `docker-compose.yml` (+ named volume по образцу `frontend_node_modules`):

```yaml
  contract:
    image: node:26-alpine
    working_dir: /repo/contract
    volumes:
      - .:/repo
      - contract_node_modules:/repo/contract/node_modules

volumes:
  contract_node_modules:
```

Первая установка зависимостей:

```bash
docker compose run --rm --no-deps contract npm install
```

Вся цепочка одной командой (npm-скрипт в `contract/package.json`):

```json
{
  "scripts": {
    "generate": "tsp compile . && openapi-ts"
  }
}
```

Обёртка `script/generate` в корне (каталог `script/` уже существует; Makefile — равнозначная альтернатива, разрешённая task_2.md, но вводил бы новую конвенцию в корне):

```bash
#!/usr/bin/env bash
set -euo pipefail
docker compose run --rm --no-deps contract npm run generate
```

Итого с хоста: **`./script/generate`** → tsp-компиляция (`contract/openapi.yaml`) → openapi-ts (`frontend/src/api`). Rails-сторона артефактов «генерации» не требует: гем читает закоммиченную спеку; после правки контракта `web` перезапускается (спека грузится при старте — обычное поведение middleware).

## 5. Рекомендуемые конфиги (для тикета #24)

`contract/package.json` (пины точные — оба инструмента на 0.x/быстро движутся; tsp — 1.x, но фиксируем для воспроизводимости):

```json
{
  "name": "contract",
  "private": true,
  "type": "module",
  "scripts": { "generate": "tsp compile . && openapi-ts" },
  "devDependencies": {
    "@hey-api/openapi-ts": "0.99.0",
    "@typespec/compiler": "1.17.0",
    "@typespec/openapi3": "1.17.0"
  }
}
```

`contract/tspconfig.yaml` — спека по стабильному пути `contract/openapi.yaml`:

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}"
    output-file: openapi.yaml
```

`contract/openapi-ts.config.ts` — SDK прямо в дереве фронтенда:

```ts
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "../frontend/src/api",
});
```

Rails (бекенд):

```ruby
# Gemfile
gem "openapi_first"

# config/initializers/openapi_first.rb
OpenapiFirst.register(Rails.root.join("contract/openapi.yaml").to_s)

# config/application.rb (внутри класса приложения)
config.middleware.use OpenapiFirst::Middlewares::RequestValidation
```

Контрольные вопросы, которые уходят в другие тикеты карты: состав сущностей и путей с префиксом `/api` — #21/#19; границы тестирования (контрактные тесты `OpenapiFirst::Test` в request-спеках) — #23; сборка всей цепочки — #24.

## Источники

- TypeSpec: [docs — установка, tsp init/compile](https://typespec.io/docs), [опции эмиттера openapi3](https://typespec.io/docs/emitters/openapi3/reference/emitter/), [конфигурация tspconfig](https://typespec.io/docs/handbook/configuration/configuration/), npm: [@typespec/compiler](https://www.npmjs.com/package/@typespec/compiler), [@typespec/openapi3](https://www.npmjs.com/package/@typespec/openapi3); preview-статус клиентных/серверных эмиттеров: [clients/introduction.mdx](https://github.com/microsoft/typespec/blob/main/website/src/content/docs/docs/emitters/clients/introduction.mdx), [http-server-js/project.md](https://github.com/microsoft/typespec/blob/main/website/src/content/docs/docs/emitters/servers/http-server-js/project.md).
- heyapi: [get-started](https://heyapi.dev/docs/openapi/typescript/get-started), [configuration](https://heyapi.dev/docs/openapi/typescript/configuration), [output](https://heyapi.dev/docs/openapi/typescript/output), [clients](https://heyapi.dev/docs/openapi/typescript/clients), [fetch-клиент](https://heyapi.dev/docs/openapi/typescript/clients/fetch), [sdk-плагин](https://heyapi.dev/docs/openapi/typescript/plugins/sdk); npm: [@hey-api/openapi-ts](https://www.npmjs.com/package/@hey-api/openapi-ts), [@hey-api/client-fetch (deprecated)](https://www.npmjs.com/package/@hey-api/client-fetch), [@hey-api/vite-plugin](https://www.npmjs.com/package/@hey-api/vite-plugin).
- OpenAPI Generator: [доки ruby-on-rails](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/ruby-on-rails.md), [шаблоны ruby-on-rails-server](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources/ruby-on-rails-server) (routes/controller/model.mustache), [installation](https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/installation.md), [релиз v7.26.0](https://github.com/OpenAPITools/openapi-generator/releases/latest).
- Ruby-гемы (RubyGems API + README): [openapi_first 4.2.0](https://rubygems.org/gems/openapi_first) / [README](https://github.com/ahx/openapi_first) / [Rails-пример](https://github.com/ahx/openapi_first/tree/main/examples/rails_app); [committee 5.6.4](https://rubygems.org/gems/committee) / [README](https://github.com/interagent/committee); [openapi_contracts 0.17.0](https://rubygems.org/gems/openapi_contracts) / [README](https://github.com/mkon/openapi_contracts); [rswag 2.17.0](https://rubygems.org/gems/rswag).
