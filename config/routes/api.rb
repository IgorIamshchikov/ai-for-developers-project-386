# GENERATED FILE — DO NOT EDIT BY HAND.
# Source: contract/openapi.yaml (compiled from contract/main.tsp).
# Regenerate: ./script/generate

namespace :api do
  resources :bookings, only: %i[index create]
  resources :event_types, path: "event-types", only: %i[index create] do
    get :slots, on: :member
  end
end
