# Wired to the contract (contract/main.tsp, config/routes.rb).
# Slot computation (#slots) is out of scope of ticket #27 — it lands with
# the slots/bookings ticket (#28).
module Api
  class EventTypesController < ApplicationController
    def index
      render json: EventType.order(:title).map { |event_type| event_type_json(event_type) }
    end

    def create
      event_type = EventType.new(event_type_params)

      if event_type.save
        render json: event_type_json(event_type), status: :created
      else
        render json: validation_error(event_type), status: :unprocessable_content
      end
    end

    def slots
      render json: []
    end

    private

    def event_type_params
      params.permit(:title, :description, :durationMinutes).to_h do |key, value|
        key == "durationMinutes" ? [ :duration_minutes, value ] : [ key, value ]
      end
    end

    def event_type_json(event_type)
      {
        id: event_type.id,
        title: event_type.title,
        description: event_type.description,
        durationMinutes: event_type.duration_minutes
      }
    end

    def validation_error(event_type)
      { error: { code: "validation", message: event_type.errors.full_messages.to_sentence } }
    end
  end
end
