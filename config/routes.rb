Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Mirrors contract/main.tsp 1:1 (see docs/research/22-generation-tooling.md):
  # the contract is the source of truth, routes are hand-written thin stubs.
  namespace :api do
    resources :event_types, path: "event-types", only: %i[index create] do
      get :slots, on: :member
    end
    resources :bookings, only: %i[index create]
  end

  # Defines the root path route ("/")
  # root "posts#index"

  # SPA fallback: any non-API path that doesn't match a static asset in
  # public/ (JS/CSS, etc.) is handed to the frontend's client-side router.
  get "*path", to: "static#fallback", constraints: ->(req) { !req.path.start_with?("/api/") }
end
