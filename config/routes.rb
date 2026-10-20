Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # config/routes/api.rb is generated from contract/openapi.yaml — see
  # contract/generate-rails.mjs. Regenerate via ./script/generate, don't
  # hand-edit it.
  draw(:api)

  # Defines the root path route ("/")
  # root "posts#index"

  # SPA fallback: any non-API path that doesn't match a static asset in
  # public/ (JS/CSS, etc.) is handed to the frontend's client-side router.
  get "*path", to: "static#fallback", constraints: ->(req) { !req.path.start_with?("/api/") }
end
