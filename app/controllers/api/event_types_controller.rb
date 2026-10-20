# Wired to the contract (contract/main.tsp, config/routes/api.rb).
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
      event_type = find_event_type(params[:id])
      slots = SlotCalculator.new(event_type).call
      render json: slots.map { |slot| slot_json(slot) }
    end

    private

    def find_event_type(id)
      EventType.find(id)
    rescue ActiveRecord::StatementInvalid
      raise ActiveRecord::RecordNotFound
    end

    def event_type_params
      params.permit(*ApiParams::EventTypeCreate::PERMITTED).to_h.transform_keys do |key|
        ApiParams::EventTypeCreate::KEY_MAP.fetch(key, key)
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

    def slot_json(slot)
      { startsAt: slot[:startsAt].iso8601, endsAt: slot[:endsAt].iso8601 }
    end
  end
end
