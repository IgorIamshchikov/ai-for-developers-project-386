# Route stubs wired to the contract (contract/main.tsp, config/routes.rb).
# Business logic (persistence, slot computation) is out of scope of the
# "Спецификация бронирования" map (issue #18) — it lands in a later ticket.
module Api
  class EventTypesController < ApplicationController
    def index
      render json: []
    end

    def create
      head :not_implemented
    end

    def slots
      render json: []
    end
  end
end
