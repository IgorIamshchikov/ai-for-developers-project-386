# Route stubs wired to the contract (contract/main.tsp, config/routes.rb).
# Business logic (persistence, conflict detection) is out of scope of the
# "Спецификация бронирования" map (issue #18) — it lands in a later ticket.
module Api
  class BookingsController < ApplicationController
    def index
      render json: []
    end

    def create
      head :not_implemented
    end
  end
end
